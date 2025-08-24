import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/transactions', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ message: 'Transactions endpoint - to be implemented' });
});

export default router;