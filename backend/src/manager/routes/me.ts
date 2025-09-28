import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { User } from '../../models/User';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const userId = (req.user as any)._id;
  const me = await User.findById(userId)
    .populate({ path: 'team', populate: ['roster', 'starters'] });
  res.json(me);
});

export default router;
