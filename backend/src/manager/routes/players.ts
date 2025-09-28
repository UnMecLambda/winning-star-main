import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { Player } from '../models/Player';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  const players = await Player.find().sort({ price: 1 }).limit(500);
  res.json(players);
});

export default router;
