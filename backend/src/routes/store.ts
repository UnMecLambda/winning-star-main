import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/items', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ message: 'Store items endpoint - to be implemented' });
});

router.post('/purchase', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ message: 'Purchase endpoint - to be implemented' });
});

export default router;