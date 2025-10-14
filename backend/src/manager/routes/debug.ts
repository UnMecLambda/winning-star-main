import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { Player } from '../models/Player';
import { Team } from '../models/Team';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.get('/status', authenticate, async (req: AuthRequest, res) => {
  const userId = (req.user as any)?._id;
  const players = await Player.countDocuments();
  const team = await Team.findOne({ owner: userId }).select('_id owner roster starters');
  res.json({ ok: true, players, hasTeam: !!team, team });
});

export default router;
