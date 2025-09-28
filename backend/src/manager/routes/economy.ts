import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { User } from '../../models/User';

const EARN_COOLDOWN_SEC = 60;
const EARN_MAX_PER_HOUR = 500;

function coinsFromScore(game:'pong'|'runner'|'dribble', score:number){
  const k = game==='pong'?50 : game==='runner'?100 : 80;
  return Math.min(200, Math.floor(score / k));
}

const router = Router();

router.post('/earn', authenticate, async (req: AuthRequest, res) => {
  const p = z.object({
    game: z.enum(['pong','runner','dribble']),
    score: z.number().int().min(0).max(1_000_000),
    signature: z.string()
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error);

  const userId = (req.user as any)._id;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const now = new Date();
  if (user.lastEarnAt && (now.getTime() - user.lastEarnAt.getTime())/1000 < EARN_COOLDOWN_SEC)
    return res.status(429).json({ error: 'Too fast' });

  const wStart = user.earnWindow?.windowStart ?? new Date(now.getTime() - 3600_000);
  const inWindow = (now.getTime() - new Date(wStart).getTime()) < 3600_000;
  const current = inWindow ? (user.earnWindow?.amount ?? 0) : 0;

  const delta = coinsFromScore(p.data.game, p.data.score);
  if (current + delta > EARN_MAX_PER_HOUR)
    return res.status(429).json({ error: 'Hourly cap reached' });

  user.coins = (user.coins ?? 0) + delta;
  user.lastEarnAt = now;
  user.earnWindow = inWindow
    ? { windowStart: wStart, amount: current + delta }
    : { windowStart: now, amount: delta };

  await user.save();
  res.json({ ok: true, earned: delta, balance: user.coins });
});

export default router;
