import { Types } from 'mongoose';
import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { User } from '../../models/User';

async function pickOne(pos: 'PG'|'SG'|'SF'|'PF'|'C') {
  const res = await Player.aggregate([
    { $match: { position: pos } },
    { $sample: { size: 1 } },
  ]);
  return res[0]?._id as Types.ObjectId;
}

export async function createDefaultTeamForUser(userId: Types.ObjectId) {
  // déjà une team ?
  const exists = await Team.findOne({ owner: userId });
  if (exists) return exists;

  // 1 joueur par poste
  const roster: Types.ObjectId[] = [];
  for (const pos of ['PG','SG','SF','PF','C'] as const) {
    const id = await pickOne(pos);
    if (id) roster.push(id);
  }
  if (roster.length !== 5) throw new Error('Not enough players to build default team');

  const team = await Team.create({
    owner: userId,
    name: 'My Team',
    roster,
    starters: roster,
    tactics: {
      offense: { fastBreak: 50, ballMovement: 50, isolation: 50 },
      defense: { man: 60, zone: 40, pressure: 50 }
    }
  });

  // lie au user (team + coins si pas présents)
  await User.findByIdAndUpdate(userId, {
    team: team._id,
    $setOnInsert: { coins: 2000 }
  });

  return team;
}
