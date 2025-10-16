import { Server } from 'socket.io';
import { Types } from 'mongoose';
import { Match, MatchDoc } from '../models/Match';
import { Team } from '../models/Team';
import { simulateMatch } from './simulateMatch';
import { DEFAULT_DEF, DEFAULT_OFF } from '../models/Tactics';

let ioRef: Server | null = null;
export function setLiveIO(io: Server) { ioRef = io; }

function room(matchId: Types.ObjectId|string) { return `match:${matchId}`; }

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

  // ⏳ laisse le client rejoindre la room
  await new Promise(r => setTimeout(r, 800));

  const sim = await simulateMatch(home, away, { playByPlay: true });
  const events = sim.playByPlay || [];

  console.log('[live] start stream', match._id.toString(), 'events=', events.length);

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

  console.log('[live] ended', match._id.toString(), sim.scoreHome, '-', sim.scoreAway);

  ioRef.to(room(match._id)).emit('match:ended', {
    matchId: match._id,
    scoreHome: sim.scoreHome, scoreAway: sim.scoreAway,
    boxHome: sim.boxHome, boxAway: sim.boxAway
  });
}

export async function startFriendlyLive(homeTeamId: string, awayTeamId: string) {
  const [home, away] = await Promise.all([ Team.findById(homeTeamId), Team.findById(awayTeamId) ]);
  if (!home || !away) throw new Error('Teams not found');
  if (home.starters.length !== 5 || away.starters.length !== 5) throw new Error('Need 5 starters');

  const match = await Match.create({
    status: 'scheduled',
    home: home._id,
    away: away._id,
    tacticsHome: home.tactics ?? { offense: DEFAULT_OFF, defense: DEFAULT_DEF },
    tacticsAway: away.tactics ?? { offense: DEFAULT_OFF, defense: DEFAULT_DEF },
  });

  // lance en tâche de fond
  startLiveMatch(match).catch(e => console.error('[live] start error', e));
  return match._id;
}

export async function simulateFriendlyInstant(homeTeamId: string, awayTeamId: string) {
  const [home, away] = await Promise.all([ Team.findById(homeTeamId), Team.findById(awayTeamId) ]);
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
  return { matchId: match._id, ...sim };
}
