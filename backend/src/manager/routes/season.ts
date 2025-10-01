import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { z } from 'zod';
import { Player } from '../models/Player';
import { tickSeasonAll } from '../services/playerDev';

const router = Router();

// Avance toute la ligue d'une saison (admin/dev)
router.post('/advance', authenticate, async (_req: AuthRequest, res) => {
  await tickSeasonAll();
  res.json({ ok: true });
});

// Entrainement ciblé d’un joueur (coût en coins)
const trainSchema = z.object({
  playerId: z.string(),
  focus: z.enum(['shooting','defense','rebound','athleticism','playmaking'])
});
router.post('/train', authenticate, async (req: AuthRequest, res) => {
  const p = trainSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error);

  const player = await Player.findById(p.data.playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // coût et effet simples
  const cost = 120;
  // @ts-ignore: ton IUser a coins
  if ((req.user?.coins ?? 0) < cost) return res.status(402).json({ error: 'Not enough coins' });
  // @ts-ignore
  req.user.coins -= cost;

  const bump = () => 0.8 + Math.random()*1.4; // ~0.8–2.2
  switch (p.data.focus) {
    case 'shooting':     player.ratingOff = Math.min(99, player.ratingOff + bump()); player.threePt = Math.min(99, player.threePt + bump()); break;
    case 'defense':      player.ratingDef = Math.min(99, player.ratingDef + bump()); break;
    case 'rebound':      player.ratingReb = Math.min(99, player.ratingReb + bump()); break;
    case 'athleticism':  player.speed = Math.min(99, player.speed + bump()); player.stamina = Math.min(99, player.stamina + bump()); break;
    case 'playmaking':   player.pass = Math.min(99, player.pass + bump()); player.dribble = Math.min(99, player.dribble + bump()); break;
  }

  await Promise.all([(req.user as any).save(), player.save()]);
  res.json({ ok: true, player });
});

export default router;
