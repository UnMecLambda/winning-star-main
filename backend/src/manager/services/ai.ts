import { Types } from 'mongoose';
import { Player } from '../models/Player';
import { Team } from '../models/Team';

function ovrExpr() {
  return {
    $round: [
      {
        $add: [
          { $multiply: ['$ratingOff', 0.35] },
          { $multiply: ['$ratingDef', 0.25] },
          { $multiply: ['$ratingReb', 0.15] },
          { $multiply: ['$threePt', 0.10] },
          { $multiply: ['$dribble', 0.075] },
          { $multiply: ['$pass', 0.075] }
        ]
      },
      0
    ]
  };
}

export async function ensureAiTeam(
  difficulty: 'easy'|'normal'|'hard'|'legend'
): Promise<string | Error> {
  try {
    const name = `AI ${difficulty[0].toUpperCase()}${difficulty.slice(1)}`;

    const exists = await Team.findOne({ isAI: true, name }).select('_id');
    if (exists) return exists._id.toString();

    const bias = {
      easy:   { min: 55, max: 74 },
      normal: { min: 62, max: 84 },
      hard:   { min: 72, max: 92 },
      legend: { min: 80, max: 99 },
    }[difficulty];

    async function pickForPos(pos: 'PG'|'SG'|'SF'|'PF'|'C') {
      let res = await Player.aggregate([
        { $match: { position: pos } },
        { $addFields: { ovr: ovrExpr() } },
        { $match: { ovr: { $gte: bias.min, $lte: bias.max } } },
        { $sample: { size: 1 } }
      ]);
      if (res[0]) return res[0]._id as Types.ObjectId;

      res = await Player.aggregate([
        { $match: { position: pos } },
        { $addFields: { ovr: ovrExpr() } },
        { $sort: { ovr: -1 } },
        { $limit: 1 }
      ]);
      if (res[0]) return res[0]._id as Types.ObjectId;

      res = await Player.aggregate([
        { $match: { position: pos } },
        { $sample: { size: 1 } }
      ]);
      return res[0]?._id as Types.ObjectId | undefined;
    }

    const roster: Types.ObjectId[] = [];
    for (const pos of ['PG','SG','SF','PF','C'] as const) {
      const id = await pickForPos(pos);
      if (id) roster.push(id);
    }
    if (roster.length !== 5) {
      return new Error('AI roster build failed: not enough players for all positions');
    }

    const team = await Team.create({
      isAI: true,            // ← important
      name,
      roster,
      starters: roster,
    });

    return team._id.toString();
  } catch (e: any) {
    return new Error(`ensureAiTeam error: ${e?.message || e}`);
  }
}
