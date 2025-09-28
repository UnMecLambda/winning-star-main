import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { Team } from '../models/Team';
import { Match } from '../models/Match';
import { simulateMatch } from '../services/simulateMatch';

const router = Router();

router.post('/simulate', authenticate, async (req: AuthRequest, res) => {
  const parsed = z.object({ opponentTeamId: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const myId = (req.user as any)._id;
  const myTeam = await Team.findOne({ owner: myId });
  const oppTeam = await Team.findById(parsed.data.opponentTeamId);
  if (!myTeam || !oppTeam) return res.status(404).json({ error: 'Team not found' });
  if (myTeam.starters.length !== 5 || oppTeam.starters.length !== 5)
    return res.status(400).json({ error: 'Both teams need 5 starters' });

  const sim = await simulateMatch(myTeam as any, oppTeam as any);
  const match = await Match.create({
    home: myTeam._id,
    away: oppTeam._id,
    scoreHome: sim.scoreHome,
    scoreAway: sim.scoreAway,
    boxHome: sim.boxHome,
    boxAway: sim.boxAway
  });

  res.json({ matchId: match._id, ...sim, reward: 10 });
});

export default router;
