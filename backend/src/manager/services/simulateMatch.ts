import { Types } from 'mongoose';
import { Player, PlayerDoc } from '../models/Player';
import { TeamDoc } from '../models/Team';
import { OffTactic, DefTactic } from '../models/Tactics';

type Box = { player: Types.ObjectId, pts: number, reb: number, ast: number, stl: number, blk: number, tov: number, min: number };
type PBPEvent = { t: number; team: 'home'|'away'; kind: 'shot2'|'shot3'|'miss2'|'miss3'|'rebound'|'turnover'|'assist'|'block'|'steal'|'foul'|'tipoff'; player?: Types.ObjectId; assist?: Types.ObjectId };

const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const rnd=(n:number)=>Math.random()*n;

// multiplicateurs tactiques
function offMods(off: OffTactic) {
  switch (off) {
    case 'fast_break':     return { pace:+8,  usageIso:-0.05, assist:+0.05, tov:+0.03, threeRate:+0.05 };
    case 'ball_movement':  return { pace:+0,  usageIso:-0.10, assist:+0.15, tov:-0.02, threeRate:+0.08 };
    case 'isolation':      return { pace:-2,  usageIso:+0.18, assist:-0.20, tov:+0.01, threeRate:+0.00 };
    case 'pick_and_roll':  return { pace:+2,  usageIso:+0.05, assist:+0.10, tov:+0.00, threeRate:+0.04 };
    case 'post_up':        return { pace:-4,  usageIso:+0.10, assist:-0.05, tov:+0.00, threeRate:-0.06 };
    case 'pace_and_space': return { pace:+3,  usageIso:+0.00, assist:+0.05, tov:+0.00, threeRate:+0.10 };
  }
}
function defMods(def: DefTactic) {
  switch (def) {
    case 'man_to_man':       return { threeAcc: 0, rimAcc: 0, tov:+0.00, pace:0, reb:0 };
    case 'zone_23':          return { threeAcc:+0.02, rimAcc:-0.05, tov:-0.01, pace:-1, reb:-0.02 };
    case 'zone_32':          return { threeAcc:-0.04, rimAcc:+0.01, tov:+0.01, pace:-1, reb:-0.01 };
    case 'switch_all':       return { threeAcc:-0.02, rimAcc:+0.00, tov:+0.02, pace:0, reb:-0.02 };
    case 'drop':             return { threeAcc:+0.03, rimAcc:-0.04, tov:+0.00, pace:0, reb:+0.01 };
    case 'full_court_press': return { threeAcc: 0,   rimAcc: 0,   tov:+0.04, pace:+4, reb:-0.03 };
  }
}

export async function simulateMatch(home: TeamDoc, away: TeamDoc, opts?: { playByPlay?: boolean }) {
  const [H, A] = await Promise.all([
    Player.find({ _id: { $in: home.starters } }) as unknown as Promise<PlayerDoc[]>,
    Player.find({ _id: { $in: away.starters } }) as unknown as Promise<PlayerDoc[]>,
  ]);

  const sum = (a:number[]) => a.reduce((p,c)=>p+c,0);
  const scoreAbility = (p: PlayerDoc) =>
    p.ratingOff * 0.6 + p.threePt * 0.2 + p.dribble * 0.2;

  const hmO = offMods(home.tactics?.offense ?? 'pace_and_space');
  const awO = offMods(away.tactics?.offense ?? 'pace_and_space');
  const hmD = defMods(home.tactics?.defense ?? 'man_to_man');
  const awD = defMods(away.tactics?.defense ?? 'man_to_man');

  const hOff = sum(H.map(scoreAbility));
  const aOff = sum(A.map(scoreAbility));
  const hDef = sum(H.map(p => p.ratingDef * 0.8 + p.stamina * 0.2));
  const aDef = sum(A.map(p => p.ratingDef * 0.8 + p.stamina * 0.2));
  const hReb = sum(H.map(p => p.ratingReb));
  const aReb = sum(A.map(p => p.ratingReb));

  let paceBase = 90 + ((sum(H.map(p=>p.speed)) - sum(A.map(p=>p.speed)))/500);
  paceBase += hmO.pace + awO.pace + hmD.pace + awD.pace;

  const expH = clamp((hOff - aDef)/12 + paceBase + 3, 70, 145);
  const expA = clamp((aOff - hDef)/12 + paceBase,       70, 145);

  const scoreHome = Math.round(expH + (Math.random()-0.5)*10);
  const scoreAway = Math.round(expA + (Math.random()-0.5)*10);

  const distribute = (ps: PlayerDoc[], total:number, off: ReturnType<typeof offMods>) : Box[] => {
    // poids d'usage : isolation booste les meilleurs scoreurs
    const baseW = ps.map(p => p.ratingOff*0.55 + p.threePt*0.25 + p.dribble*0.20);
    const maxIdx = baseW.indexOf(Math.max(...baseW));
    baseW[maxIdx] *= (1 + Math.max(0, off.usageIso)); // boost iso
    const W = baseW.reduce((p,c)=>p+c,0);

    return ps.map((p,i)=>{
      const share = total * (baseW[i]/W);
      const threeBonus = off.threeRate; // oriente vers 3pts
      const pts = Math.max(0, Math.round(share + (Math.random()-0.5)*6));

      const reb = Math.round((p.ratingReb/99) * (40/ps.length) + rnd(2));
      const ast = Math.round(((p.pass)/99) * (25/ps.length) * (1 + off.assist) + rnd(2));
      const stl = Math.round((p.ratingDef/99) * (1 + Math.max(0, hmD.tov)) * rnd(3));
      const blk = Math.round((p.ratingDef/99) * rnd(2));
      const tov = Math.round(Math.max(0, rnd(3) * (1 + off.tov)));

      const min = Math.max(24, Math.min(38, 26 + Math.round(((p.stamina)-70)/2 + rnd(8))));
      return { player: p._id, pts, reb, ast, stl, blk, tov, min };
    });
  };

  const boxHome = distribute(H, scoreHome, hmO);
  const boxAway = distribute(A, scoreAway, awO);

  const fix=(box:Box[], target:number)=>{
    const diff = target - box.reduce((p,c)=>p+c.pts,0);
    if (diff) {
      const i = Math.floor(Math.random()*box.length);
      box[i].pts = Math.max(0, box[i].pts + diff);
    }
  };
  fix(boxHome, scoreHome);
  fix(boxAway, scoreAway);

  // rebond d’équipe influencé par les tactiques défensives
  const rebAdjH = hReb * (1 + (hmD.reb ?? 0));
  const rebAdjA = aReb * (1 + (awD.reb ?? 0));
  if (rebAdjH > rebAdjA) boxHome.forEach(b=>b.reb+=1);
  else if (rebAdjA > rebAdjH) boxAway.forEach(b=>b.reb+=1);

  // ---- Play-by-play minimal pour animer des "points" sur le terrain
  let pbp: PBPEvent[] = [];
  if (opts?.playByPlay) {
    const possessions = Math.round((scoreHome + scoreAway) / 2); // approx
    let clock = 48 * 60; // secondes
    for (let i=0;i<possessions;i++){
      clock -= Math.max(4, Math.round( rnd(18) ));
      const team = Math.random() < 0.5 ? 'home' : 'away';
      const roster = team === 'home' ? H : A;
      const box   = team === 'home' ? boxHome : boxAway;

      // pick random player weighted by ratingOff
      const w = roster.map(p => p.ratingOff);
      const W = w.reduce((p,c)=>p+c,0);
      let acc = Math.random()*W, idx = 0;
      for (; idx<w.length; idx++){ acc -= w[idx]; if (acc<=0) break; }
      const shooter = roster[Math.min(idx, roster.length-1)];
      const shooterId = shooter._id;

      // 2pts vs 3pts selon tactique offensive + defensive adverse
      const off = team==='home'? hmO : awO;
      const def = team==='home'? awD : hmD;
      const threeProb = 0.32 + off.threeRate + (def.threeAcc ?? 0);
      const is3 = Math.random() < threeProb;

      // accuracy
      const baseAcc = (shooter.ratingOff/140) + (is3 ? shooter.threePt/200 : 0) - (is3 ? 0.02 : 0);
      const accMod = (is3 ? (-(def.threeAcc ?? 0)) : (-(def.rimAcc ?? 0)));
      const made = Math.random() < clamp(baseAcc + accMod, 0.25, 0.72);

      if (made) {
        pbp.push({ t: clock, team, kind: is3 ? 'shot3' : 'shot2', player: shooterId });
        // petite chance d'assist
        if (Math.random() < 0.55 + off.assist) {
          const mates = roster.filter(p => p._id.toString() !== shooterId.toString());
          const a = mates[Math.floor(Math.random()*mates.length)];
          pbp.push({ t: clock, team, kind: 'assist', player: a._id, assist: shooterId });
        }
      } else {
        pbp.push({ t: clock, team, kind: is3 ? 'miss3' : 'miss2', player: shooterId });
        // rebond aléatoire
        pbp.push({ t: clock, team: Math.random()<0.55 ? team : (team==='home'?'away':'home'), kind: 'rebound' });
      }

      // turnovers stimulés par défenses agressives
      if (Math.random() < 0.10 + (def.tov ?? 0)) {
        pbp.push({ t: clock, team, kind: 'turnover', player: shooterId });
      }
    }
  }

  return { scoreHome, scoreAway, boxHome, boxAway, playByPlay: pbp };
}
