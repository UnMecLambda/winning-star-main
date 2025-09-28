import { Router } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { User } from '../../models/User';
import { Team } from '../models/Team';
import { Player, PlayerDoc } from '../models/Player';

const router = Router();

router.post('/buy', authenticate, async (req: AuthRequest, res) => {
  const parsed = z.object({ playerId: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const userId = (req.user as any)._id as Types.ObjectId;

  const [user, team, player] = await Promise.all([
    User.findById(userId),
    Team.findOne({ owner: userId }),
    Player.findById(parsed.data.playerId) as unknown as Promise<PlayerDoc | null>,
  ]);

  if (!user || !team || !player) return res.status(404).json({ error: 'Not found' });

  if (team.roster.some(id => id.toString() === player._id.toString()))
    return res.status(409).json({ error: 'Already owned' });

  if ((user.coins ?? 0) < player.price)
    return res.status(402).json({ error: 'Not enough coins' });

  user.coins = (user.coins ?? 0) - player.price;
  team.roster.push(player._id);
  await Promise.all([user.save(), team.save()]);

  res.json({ ok: true, coins: user.coins });
});

router.post('/set-starters', authenticate, async (req: AuthRequest, res) => {
  const parsed = z.object({ starterIds: z.array(z.string()).min(5).max(5) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const userId = (req.user as any)._id as Types.ObjectId;
  const team = await Team.findOne({ owner: userId });
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const allOwned = parsed.data.starterIds.every(id => team.roster.some(r => r.toString() === id));
  if (!allOwned) return res.status(400).json({ error: 'Starters must be from your roster' });

  team.starters = parsed.data.starterIds.map(id => new Types.ObjectId(id));
  await team.save();

  res.json({ ok: true, starters: team.starters });
});

const setTacticsSchema = z.object({
  offense: z.enum(['fast_break','ball_movement','isolation','pick_and_roll','post_up','pace_and_space']),
  defense: z.enum(['man_to_man','zone_23','zone_32','switch_all','drop','full_court_press'])
});

router.post('/set-tactics', authenticate, async (req: AuthRequest, res) => {
  const parsed = setTacticsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const userId = (req.user as any)._id;
  const team = await Team.findOne({ owner: userId });
  if (!team) return res.status(404).json({ error: 'Team not found' });

  team.tactics = parsed.data;
  await team.save();
  res.json({ ok: true, tactics: team.tactics });
});

export default router;
