import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { User } from '../../models/User';
import { Team } from '../models/Team';
import { Player } from '../models/Player';

const router = Router();

/** Acheter un joueur */
router.post('/buy', authenticate, async (req: AuthRequest, res) => {
  const parsed = z.object({ playerId: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const userId = (req.user as any)._id;
  const user = await User.findById(userId);
  const team = await Team.findOne({ owner: userId });
  const player = await Player.findById(parsed.data.playerId);

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

/** Définir les starters */
router.post('/set-starters', authenticate, async (req: AuthRequest, res) => {
  const parsed = z.object({ starterIds: z.array(z.string()).min(5).max(5) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const userId = (req.user as any)._id;
  const team = await Team.findOne({ owner: userId });
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const allOwned = parsed.data.starterIds.every(id => team.roster.some(r => r.toString() === id));
  if (!allOwned) return res.status(400).json({ error: 'Starters must be from your roster' });

  team.starters = parsed.data.starterIds as any;
  await team.save();
  res.json({ ok: true, starters: team.starters });
});

/** Modifier les tactiques de l'équipe */
router.post('/set-tactics', authenticate, async (req: AuthRequest, res) => {
  const tacticsSchema = z.object({
    offense: z.union([
      z.string(), // ex: "fast_break", "isolation", etc.
      z.object({
        fastBreak: z.number().min(0).max(100),
        ballMovement: z.number().min(0).max(100),
        isolation: z.number().min(0).max(100)
      })
    ]),
    defense: z.union([
      z.string(), // ex: "zone_23", "man_to_man", etc.
      z.object({
        man: z.number().min(0).max(100),
        zone: z.number().min(0).max(100),
        pressure: z.number().min(0).max(100)
      })
    ])
  });

  const parsed = tacticsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const userId = (req.user as any)._id;
  const team = await Team.findOne({ owner: userId });
  if (!team) return res.status(404).json({ error: 'Team not found' });

  // 🎯 Si on reçoit un preset (string), on convertit vers des valeurs par défaut
  const presets = {
    offense: {
      fast_break:   { fastBreak: 90, ballMovement: 60, isolation: 50 },
      isolation:    { fastBreak: 40, ballMovement: 50, isolation: 90 },
      ball_movement:{ fastBreak: 60, ballMovement: 90, isolation: 40 },
      pick_and_roll:{ fastBreak: 50, ballMovement: 70, isolation: 60 },
      pace_and_space:{ fastBreak: 70, ballMovement: 80, isolation: 40 },
      post_up:      { fastBreak: 30, ballMovement: 40, isolation: 80 },
    },
    defense: {
      man_to_man:      { man: 90, zone: 40, pressure: 60 },
      zone_23:         { man: 40, zone: 90, pressure: 50 },
      zone_32:         { man: 50, zone: 85, pressure: 50 },
      drop:            { man: 70, zone: 60, pressure: 40 },
      switch_all:      { man: 80, zone: 50, pressure: 70 },
      full_court_press:{ man: 60, zone: 40, pressure: 95 },
    }
  };

  const body = parsed.data;
  const offense = typeof body.offense === 'string' ? (presets.offense as any)[body.offense] : body.offense;
  const defense = typeof body.defense === 'string' ? (presets.defense as any)[body.defense] : body.defense;

  team.tactics = { offense, defense };
  await team.save();

  res.json({ ok: true, tactics: team.tactics });
});

export default router;
