import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { Team } from '../models/Team';

const router = Router();

/**
 * GET /api/manager/me/team
 * Retourne la team de l'utilisateur + starters + roster peuplés avec les joueurs
 */
router.get('/team', authenticate, async (req: AuthRequest, res) => {
  const userId = (req.user as any)._id;

  const team = await Team.findOne({ owner: userId })
    .populate({
      path: 'roster',
      select: 'name position ratingOff ratingDef ratingReb speed pass dribble threePt stamina age potential price'
    })
    .populate({
      path: 'starters',
      select: 'name position ratingOff ratingDef ratingReb speed pass dribble threePt stamina age potential price'
    });

  if (!team) return res.status(404).json({ error: 'Team not found' });

  res.json({ ok: true, team });
});

export default router;
