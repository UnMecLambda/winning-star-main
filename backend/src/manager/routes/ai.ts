import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { Team } from '../models/Team';
import { ensureAiTeam } from '../services/ai';
import { startFriendlyLive, simulateFriendlyInstant } from '../services/live';

const router = Router();

const schema = z.object({
  difficulty: z.enum(['easy','normal','hard','legend']).default('normal'),
  live: z.boolean().optional().default(true)
});

router.post('/start', authenticate, async (req: AuthRequest, res) => {
  try {
    const p = schema.safeParse(req.body);
    if (!p.success) return res.status(400).json(p.error);

    const myTeam = await Team.findOne({ owner: (req.user as any)._id });
    if (!myTeam) return res.status(404).json({ error: 'My team not found' });
    if (myTeam.starters.length !== 5) return res.status(400).json({ error: 'Set 5 starters' });

    const aiTeam = await ensureAiTeam(p.data.difficulty);
    if (aiTeam instanceof Error) {
      console.error('[ai/start] ensureAiTeam failed:', aiTeam.message);
      return res.status(409).json({ error: aiTeam.message });
    }

    if (p.data.live) {
      const matchId = await startFriendlyLive(myTeam._id.toString(), aiTeam);
      return res.json({ ok: true, matchId });
    } else {
      const sim = await simulateFriendlyInstant(myTeam._id.toString(), aiTeam);
      return res.json(sim);
    }
  } catch (e) {
    console.error('[ai/start] error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
export const aiRouter = router;
