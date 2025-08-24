import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - will be implemented later
router.post('/request', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ message: 'Withdrawal request endpoint - to be implemented' });
});

router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ message: 'Withdrawal history endpoint - to be implemented' });
});

export default router;