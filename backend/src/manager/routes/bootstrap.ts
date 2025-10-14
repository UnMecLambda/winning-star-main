import { Router } from 'express';
import { Types } from 'mongoose';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { User } from '../../models/User';
import { Team } from '../models/Team';
import { Player } from '../models/Player';

const router = Router();

async function pickOne(pos: 'PG'|'SG'|'SF'|'PF'|'C') {
  const res = await Player.aggregate([
    { $match: { position: pos } },
    { $sample: { size: 1 } },
  ]);
  return res[0]?._id as Types.ObjectId | undefined;
}

/** POST /api/manager/bootstrap → crée une team par défaut (5 joueurs) si absente */
router.post('/bootstrap', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = (req.user as any)?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let team = await Team.findOne({ owner: userId });
    if (!team) {
      // 1 joueur par poste
      const roster: Types.ObjectId[] = [];
      for (const pos of ['PG','SG','SF','PF','C'] as const) {
        const id = await pickOne(pos);
        if (id) roster.push(id);
      }
      if (roster.length !== 5) {
        console.error('[bootstrap] Not enough players in DB');
        return res.status(409).json({ error: 'Not enough players in DB to create a default team' });
      }

      team = await Team.create({
        owner: new Types.ObjectId(user._id),
        name: 'My Team',
        roster,
        starters: roster,
      });

      user.team = team._id as any;
      if (user.coins == null) user.coins = 2000;
      await user.save();
    }

    const populated = await Team.findById(team._id)
      .populate({ path: 'roster', select: 'name position ratingOff ratingDef ratingReb speed pass dribble threePt stamina age potential price' })
      .populate({ path: 'starters', select: 'name position ratingOff ratingDef ratingReb speed pass dribble threePt stamina age potential price' });

    return res.json({ ok: true, coins: user.coins, team: populated });
  } catch (err) {
    console.error('[bootstrap] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
