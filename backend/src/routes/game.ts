import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - will be implemented later
router.post('/result', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ message: 'Game result endpoint - to be implemented' });
});

router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ message: 'Game history endpoint - to be implemented' });
});

export default router;