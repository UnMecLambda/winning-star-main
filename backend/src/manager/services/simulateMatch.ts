import { Types } from 'mongoose';
import { ITeam } from '../models/Team';
import { Player, IPlayer } from '../models/Player';

type Box = {
  player: Types.ObjectId;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  min: number;
};

export type SimulateOptions = {
  playByPlay?: boolean;
};

export type SimulateResult = {
  scoreHome: number;
  scoreAway: number;
  boxHome: Box[];
  boxAway: Box[];
  playByPlay?: Array<{ kind: 'shot2' | 'shot3'; team: 'home' | 'away'; t: number }>;
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const rnd = (n: number) => Math.random() * n;

/**
 * Simulation simple:
 * - charge les 5 titulaires des deux équipes
 * - calcule un score attendu via ratings Off/Def/Reb
 * - génère des boxscores et (optionnel) du play-by-play pour le live
 */
export async function simulateMatch(
  home: ITeam,
  away: ITeam,
  opts: SimulateOptions = {}
): Promise<SimulateResult> {
  // 1) Charger les 5 titulaires
  const [H, A] = await Promise.all([
    Player.find({ _id: { $in: home.starters } }),
    Player.find({ _id: { $in: away.starters } }),
  ]);

  // Sécurité: si pas 5, fallback sur les 5 premiers du roster
  const needHome = H.length < 5 && home.roster?.length >= 5;
  const needAway = A.length < 5 && away.roster?.length >= 5;
  if (needHome) {
    const hb = await Player.find({ _id: { $in: home.roster.slice(0, 5) } });
    if (hb.length === 5) H.splice(0, H.length, ...hb);
  }
  if (needAway) {
    const ab = await Player.find({ _id: { $in: away.roster.slice(0, 5) } });
    if (ab.length === 5) A.splice(0, A.length, ...ab);
  }

  if (H.length !== 5 || A.length !== 5) {
    // dernier fallback: renvoie un score neutre
    return {
      scoreHome: 70,
      scoreAway: 70,
      boxHome: [],
      boxAway: [],
      playByPlay: opts.playByPlay ? [] : undefined,
    };
  }

  // 2) Evaluer les forces
  const sum = (arr: number[]) => arr.reduce((p, c) => p + c, 0);

  const hOff = sum(H.map((p) => p.ratingOff));
  const aOff = sum(A.map((p) => p.ratingOff));
  const hDef = sum(H.map((p) => p.ratingDef));
  const aDef = sum(A.map((p) => p.ratingDef));
  const hReb = sum(H.map((p) => p.ratingReb));
  const aReb = sum(A.map((p) => p.ratingReb));

  // influence simple des tactiques si présentes
  const offBiasHome =
    (home.tactics?.offense?.fastBreak ?? 50) * 0.06 +
    (home.tactics?.offense?.ballMovement ?? 50) * 0.04 +
    (home.tactics?.offense?.isolation ?? 50) * 0.03;
  const offBiasAway =
    (away.tactics?.offense?.fastBreak ?? 50) * 0.06 +
    (away.tactics?.offense?.ballMovement ?? 50) * 0.04 +
    (away.tactics?.offense?.isolation ?? 50) * 0.03;

  const defBiasHome =
    (home.tactics?.defense?.man ?? 60) * 0.05 +
    (home.tactics?.defense?.zone ?? 40) * 0.03 +
    (home.tactics?.defense?.pressure ?? 50) * 0.05;
  const defBiasAway =
    (away.tactics?.defense?.man ?? 60) * 0.05 +
    (away.tactics?.defense?.zone ?? 40) * 0.03 +
    (away.tactics?.defense?.pressure ?? 50) * 0.05;

  const pace = 90 + rnd(20) - 10;

  const expH = clamp((hOff - aDef) / 10 + pace + offBiasHome * 0.1 - defBiasAway * 0.08, 70, 140);
  const expA = clamp((aOff - hDef) / 10 + pace + offBiasAway * 0.1 - defBiasHome * 0.08, 70, 140);

  const scoreHome = Math.round(expH + (Math.random() - 0.5) * 10);
  const scoreAway = Math.round(expA + (Math.random() - 0.5) * 10);

  // 3) Distribution boxscore
  const distribute = (ps: IPlayer[], total: number): Box[] => {
    const w = ps.map((p) => Math.max(1, p.ratingOff));
    const W = w.reduce((p, c) => p + c, 0);
    return ps.map((p, i) => {
      const share = total * (w[i] / W);
      const pts = Math.max(0, Math.round(share + (Math.random() - 0.5) * 6));
      const reb = Math.round((p.ratingReb / 99) * (40 / ps.length) + rnd(2));
      const ast = Math.round((p.ratingOff / 99) * (25 / ps.length) + rnd(2));
      const stl = Math.round((p.ratingDef / 99) * rnd(3));
      const blk = Math.round((p.ratingDef / 99) * rnd(2));
      const tov = Math.round(rnd(3));
      return {
        player: p._id as Types.ObjectId,
        pts,
        reb,
        ast,
        stl,
        blk,
        tov,
        min: 30 + Math.round(rnd(8)),
      };
    });
  };

  const boxHome = distribute(H, scoreHome);
  const boxAway = distribute(A, scoreAway);

  // Ajuste total si décalage
  const fix = (box: Box[], target: number) => {
    const sumPts = box.reduce((p, c) => p + c.pts, 0);
    const diff = target - sumPts;
    if (diff) {
      const i = Math.floor(Math.random() * box.length);
      box[i].pts = Math.max(0, box[i].pts + diff);
    }
  };
  fix(boxHome, scoreHome);
  fix(boxAway, scoreAway);

  // petit bonus rebonds à l'équipe avec meilleur total Rebound
  if (hReb > aReb) boxHome.forEach((b) => (b.reb += 1));
  else if (aReb > hReb) boxAway.forEach((b) => (b.reb += 1));

  // 4) Play-by-play (facultatif)
  let pbp: SimulateResult['playByPlay'] = undefined;
  if (opts.playByPlay) {
    pbp = [];
    // on génère ~30 évènements tirs 2/3 pts cohérents avec le score
    const eventsCount = 30;
    let accH = 0;
    let accA = 0;

    for (let t = 1; t <= eventsCount; t++) {
      const isThree = Math.random() < 0.35;
      const team: 'home' | 'away' = Math.random() < 0.5 ? 'home' : 'away';
      pbp.push({ kind: isThree ? 'shot3' : 'shot2', team, t });

      if (team === 'home') accH += isThree ? 3 : 2;
      else accA += isThree ? 3 : 2;
    }

    // étire un peu pour coller au score final (sans être exact)
    const deltaH = Math.max(0, scoreHome - accH);
    const deltaA = Math.max(0, scoreAway - accA);
    for (let i = 0; i < Math.floor(deltaH / 2); i++) pbp.push({ kind: 'shot2', team: 'home', t: eventsCount + i + 1 });
    for (let i = 0; i < Math.floor(deltaA / 2); i++) pbp.push({ kind: 'shot2', team: 'away', t: eventsCount + i + 1 });
  }

  return {
    scoreHome,
    scoreAway,
    boxHome,
    boxAway,
    playByPlay: pbp,
  };
}
