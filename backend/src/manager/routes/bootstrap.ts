import { Router } from 'express';
import { Types } from 'mongoose';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { User } from '../../models/User';
import { Team } from '../models/Team';

const router = Router();

router.post('/bootstrap', authenticate, async (req: AuthRequest, res) => {
  const userId = (req.user as any)._id.toString();
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.coins == null) user.coins = 2000;

  if (!user.team) {
    const team = await Team.create({
      owner: new Types.ObjectId(user._id),
      name: 'My Team',
      roster: [],
      starters: [],
    });
    // cast pour satisfaire TS (IUser.team?: Types.ObjectId)
    user.team = team._id as unknown as Types.ObjectId;
  }

  await user.save();
  res.json({ ok: true, coins: user.coins, team: user.team });
});

export default router;
