import { Types } from 'mongoose';
import { Player } from '../models/Player';
import { Team } from '../models/Team';

/**
 * Retourne l'ObjectId d'une équipe IA prête à jouer pour une difficulté donnée.
 * Crée et met en cache une team IA si elle n'existe pas.
 */
export async function ensureAiTeam(
  difficulty: 'easy'|'normal'|'hard'|'legend'
): Promise<string> {
  const name = `AI ${difficulty[0].toUpperCase()}${difficulty.slice(1)}`;

  // existe déjà ?
  const exists = await Team.findOne({ name, owner: { $exists: false } }).select('_id');
  if (exists) return exists._id.toString();

  // Plage d’OVR selon difficulté
  const bias = {
    easy:   { min: 55, max: 72 },
    normal: { min: 65, max: 82 },
    hard:   { min: 75, max: 90 },
    legend: { min: 82, max: 99 },
  }[difficulty];

  async function pickForPos(pos: 'PG'|'SG'|'SF'|'PF'|'C') {
    const candidates = await Player.aggregate([
      { $match: { position: pos } },
      { $addFields: { ovr: { $round: [
        { $add: [
          { $multiply: ['$ratingOff', 0.35] },
          { $multiply: ['$ratingDef', 0.25] },
          { $multiply: ['$ratingReb', 0.15] },
          { $multiply: ['$threePt', 0.10] },
          { $multiply: ['$dribble', 0.075] },
          { $multiply: ['$pass', 0.075] },
        ] }, 0 ] } } },
      { $match: { ovr: { $gte: bias.min, $lte: bias.max } } },
      { $sample: { size: 1 } }
    ]);
    if (candidates[0]) return candidates[0]._id as Types.ObjectId;

    // fallback si filtre trop strict
    const fallback = await Player.aggregate([
      { $match: { position: pos } },
      { $sample: { size: 1 } }
    ]);
    return fallback[0]?._id as Types.ObjectId;
  }

  const roster: Types.ObjectId[] = [];
  for (const pos of ['PG','SG','SF','PF','C'] as const) {
    const id = await pickForPos(pos);
    if (id) roster.push(id);
  }
  if (roster.length !== 5) throw new Error('AI roster build failed');

  const team = await Team.create({
    name,
    roster,
    starters: roster,
    // owner absent => IA
  });

  return team._id.toString();
}
