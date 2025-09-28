import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { Team } from '../models/Team';
import { startFriendlyLive, simulateFriendlyInstant } from '../services/live';

const router = Router();

const schema = z.object({ opponentTeamId: z.string(), live: z.boolean().optional() });

router.post('/start', authenticate, async (req: AuthRequest, res) => {
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error);

  const myTeam = await Team.findOne({ owner: (req.user as any)._id });
  if (!myTeam) return res.status(404).json({ error: 'My team not found' });
  if (myTeam.starters.length !== 5) return res.status(400).json({ error: 'Set 5 starters' });

  if (p.data.live) {
    const matchId = await startFriendlyLive(myTeam._id.toString(), p.data.opponentTeamId);
    return res.json({ ok: true, matchId });
  } else {
    const sim = await simulateFriendlyInstant(myTeam._id.toString(), p.data.opponentTeamId);
    return res.json(sim);
  }
});

export default router;
