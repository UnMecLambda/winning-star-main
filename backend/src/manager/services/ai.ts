import { Types } from 'mongoose';
import { Player } from '../models/Player';
import { Team } from '../models/Team';
import { DEFAULT_DEF, DEFAULT_OFF } from '../models/Tactics';

/**
 * Génère (ou récupère) une team IA selon une difficulté.
 * Difficulté impacte la qualité moyenne des joueurs choisis.
 * On conserve une team IA par difficulté pour éviter de regénérer tout le temps.
 */
export async function ensureAiTeam(difficulty: 'easy'|'normal'|'hard'|'legend'): Promise<string> {
  // Owners IA figés par difficulté (évite le 'unique: true' sur owner)
  const OWNER_IDS: Record<typeof difficulty, string> = {
    easy:   '650000000000000000000001',
    normal: '650000000000000000000002',
    hard:   '650000000000000000000003',
    legend: '650000000000000000000004',
  };
  const ownerId = new Types.ObjectId(OWNER_IDS[difficulty]);

  let team = await Team.findOne({ owner: ownerId });
  if (team && team.starters?.length === 5) return team._id.toString();

  // bornes de tirage par difficulté
  const band: Record<typeof difficulty, {min:number; max:number}> = {
    easy:   { min: 62, max: 74 },
    normal: { min: 72, max: 84 },
    hard:   { min: 80, max: 90 },
    legend: { min: 86, max: 96 },
  };

  // Récupérer une pool de joueurs par poste autour de la bande choisie
  // On prend au hasard parmi les top correspondants
  const pickByPos = async (pos: 'PG'|'SG'|'SF'|'PF'|'C') => {
    const candidates = await Player.aggregate([
      { $match: { position: pos, ratingOff: { $gte: band[difficulty].min, $lte: band[difficulty].max } } },
      { $addFields: { ov: {
        $round: [
          { $add: [
            { $multiply: ['$ratingOff', 0.35] },
            { $multiply: ['$ratingDef', 0.25] },
            { $multiply: ['$ratingReb', 0.15] },
            { $multiply: ['$threePt',   0.10] },
            { $multiply: ['$dribble',   0.075] },
            { $multiply: ['$pass',      0.075] },
          ] }, 0
        ] } },
      },
      { $sort: { ov: -1 } },
      { $limit: 12 }
    ]);
    if (candidates.length === 0) {
      // fallback: élargir la plage
      return (await Player.find({ position: pos }).sort({ ratingOff: -1 }).limit(1))[0];
    }
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  };

  const pg = await pickByPos('PG');
  const sg = await pickByPos('SG');
  const sf = await pickByPos('SF');
  const pf = await pickByPos('PF');
  const c  = await pickByPos('C');

  if (!team) {
    team = new Team({
      owner: ownerId,
      name: `CPU (${difficulty.toUpperCase()})`,
      roster: [],
      starters: [],
      tactics: { offense: DEFAULT_OFF, defense: DEFAULT_DEF }
    });
  }
  team.roster = [pg._id, sg._id, sf._id, pf._id, c._id];
  team.starters = [...team.roster];
  await team.save();

  return team._id.toString();
}
