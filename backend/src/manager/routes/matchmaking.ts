import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { Team } from '../models/Team';
import { Match } from '../models/Match';
import { DEFAULT_DEF, DEFAULT_OFF } from '../models/Tactics';
import { startLiveMatch } from '../services/live';

const router = Router();

type QItem = { teamId: string, userId: string, ts: number };
const queue: QItem[] = [];

router.post('/join', authenticate, async (req: AuthRequest, res) => {
  const myTeam = await Team.findOne({ owner: (req.user as any)._id });
  if (!myTeam) return res.status(404).json({ error: 'My team not found' });
  queue.push({ teamId: myTeam._id.toString(), userId: (req.user as any)._id.toString(), ts: Date.now() });

  // try match
  if (queue.length >= 2) {
    const a = queue.shift()!;
    // évite mirror-same user
    let b = queue.find(x => x.userId !== a.userId);
    if (!b) return res.json({ queued: true });
    queue.splice(queue.indexOf(b), 1);

    const [home, away] = await Promise.all([ Team.findById(a.teamId), Team.findById(b.teamId) ]);
    if (!home || !away) return res.json({ queued: true });

    const match = await Match.create({
      status: 'scheduled',
      home: home._id,
      away: away._id,
      tacticsHome: home.tactics ?? { offense: DEFAULT_OFF, defense: DEFAULT_DEF },
      tacticsAway: away.tactics ?? { offense: DEFAULT_OFF, defense: DEFAULT_DEF },
    });

    startLiveMatch(match).catch(()=>{});
    return res.json({ matched: true, matchId: match._id });
  }

  return res.json({ queued: true });
});

router.post('/leave', authenticate, async (req: AuthRequest, res) => {
  const uid = (req.user as any)._id.toString();
  const n = queue.length;
  for (let i=queue.length-1; i>=0; i--) if (queue[i].userId === uid) queue.splice(i,1);
  res.json({ removed: n !== queue.length });
});

router.get('/peek', authenticate, async (_req, res) => {
  res.json({ waiting: queue.length });
});

export default router;
