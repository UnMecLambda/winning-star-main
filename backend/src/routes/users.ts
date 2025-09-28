import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { username, avatar, preferences,  } = req.body;
    
    const updateData: any = {};
    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { page = 1, limit = 50, type = 'score' } = req.query;
    
    let sortField = 'stats.totalScore';
    if (type === 'level') sortField = 'level';
    if (type === 'wins') sortField = 'stats.gamesWon';
    
    const users = await User.find()
      .select('username avatar level stats')
      .sort({ [sortField]: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user._id).select('stats level experience coins');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;