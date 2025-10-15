import { Server } from 'socket.io';
import { Types } from 'mongoose';
import { Match, MatchDoc } from '../models/Match';
import { Team } from '../models/Team';
import { simulateMatch } from './simulateMatch';
import { DEFAULT_DEF, DEFAULT_OFF } from '../models/Tactics';

let ioRef: Server | null = null;
export function setLiveIO(io: Server) { ioRef = io; }

function room(matchId: Types.ObjectId|string) { return `match:${matchId}`; }

/** Lance un match live et stream le play-by-play */
export async function startLiveMatch(match: MatchDoc) {
  if (!ioRef) throw new Error('IO not set: call setLiveIO(io) at startup');

  const [home, away] = await Promise.all([
    Team.findById(match.home),
    Team.findById(match.away),
  ]);
  if (!home || !away) throw new Error('Teams not found');

  match.status = 'live';
  match.startedAt = new Date();
  await match.save();

  const sim = await simulateMatch(home, away, { playByPlay: true });

  const events = sim.playByPlay || [];
  for (const e of events) {
    ioRef.to(room(match._id)).emit('match:pbp', { matchId: match._id, ev: e });
    await new Promise(r => setTimeout(r, 300));
  }

  match.status = 'finished';
  match.scoreHome = sim.scoreHome;
  match.scoreAway = sim.scoreAway;
  match.boxHome = sim.boxHome as any;
  match.boxAway = sim.boxAway as any;
  match.finishedAt = new Date();
  await match.save();

  ioRef.to(room(match._id)).emit('match:ended', {
    matchId: match._id,
    scoreHome: sim.scoreHome, scoreAway: sim.scoreAway,
    boxHome: sim.boxHome, boxAway: sim.boxAway
  });
}

/** Match amical live entre deux teams (ne jette jamais) */
export async function startFriendlyLive(homeTeamId: string, awayTeamId: string) {
  try {
    const [home, away] = await Promise.all([
      Team.findById(homeTeamId),
      Team.findById(awayTeamId)
    ]);
    if (!home || !away) throw new Error('Teams not found');
    if (home.starters.length !== 5 || away.starters.length !== 5) throw new Error('Need 5 starters');

    const match = await Match.create({
      status: 'scheduled',
      home: home._id,
      away: away._id,
      tacticsHome: home.tactics ?? { offense: DEFAULT_OFF, defense: DEFAULT_DEF },
      tacticsAway: away.tactics ?? { offense: DEFAULT_OFF, defense: DEFAULT_DEF },
    });

    // lance en arrière-plan
    startLiveMatch(match).catch(err => console.error('[startLiveMatch] fail:', err));
    return match._id.toString();
  } catch (e: any) {
    console.error('[startFriendlyLive] error:', e?.message || e);
    // renvoyer un matchId synthétique pour ne pas casser le front (optionnel)
    return `err:${Date.now().toString(36)}`;
  }
}

/** Simulation instantanée (pas de stream) */
export async function simulateFriendlyInstant(homeTeamId: string, awayTeamId: string) {
  const [home, away] = await Promise.all([
    Team.findById(homeTeamId),
    Team.findById(awayTeamId)
  ]);
  if (!home || !away) throw new Error('Teams not found');

  const sim = await simulateMatch(home, away, { playByPlay: false });
  const match = await Match.create({
    status: 'finished',
    home: home._id,
    away: away._id,
    tacticsHome: home.tactics ?? { offense: DEFAULT_OFF, defense: DEFAULT_DEF },
    tacticsAway: away.tactics ?? { offense: DEFAULT_OFF, defense: DEFAULT_DEF },
    scoreHome: sim.scoreHome,
    scoreAway: sim.scoreAway,
    boxHome: sim.boxHome as any,
    boxAway: sim.boxAway as any,
    startedAt: new Date(),
    finishedAt: new Date()
  });
  return { ok: true, matchId: match._id.toString(), ...sim };
}
