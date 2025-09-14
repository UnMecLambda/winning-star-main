import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Character } from '../models/Character';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';

const router = express.Router();

// Get all available characters
router.get('/shop', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const characters = await Character.find({ isActive: true }).sort({ rarity: 1, price: 1 });
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Get user's characters
router.get('/my-characters', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get character details for owned characters
    const ownedCharacters = await Character.find({ 
      id: { $in: user.inventory.characters },
      isActive: true 
    });

    res.json(ownedCharacters);
  } catch (error) {
    console.error('Error fetching user characters:', error);
    res.status(500).json({ error: 'Failed to fetch user characters' });
  }
});

// Purchase a character
router.post('/purchase', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.body;
    
    const character = await Character.findOne({ id: characterId, isActive: true });
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user already owns this character
    if (user.inventory.characters.includes(characterId)) {
      return res.status(400).json({ error: 'You already own this character' });
    }
    
    // Check if character is free
    if (character.price === 0) {
      // Add free character to inventory
      user.inventory.characters.push(characterId);
      await user.save();
      
      res.json({
        message: 'Character obtained successfully',
        character,
        newBalance: user.coins
      });
      return;
    }
    
    // Check if user has enough coins
    if (user.coins < character.price) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    // Deduct coins and add character
    user.coins -= character.price;
    user.inventory.characters.push(characterId);
    
    // Create transaction
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'purchase',
      amount: -character.price,
      description: `Purchased character: ${character.name}`,
      metadata: { characterId: character.id },
      balanceBefore: user.coins + character.price,
      balanceAfter: user.coins
    });
    
    await Promise.all([
      user.save(),
      transaction.save()
    ]);
    
    res.json({
      message: 'Character purchased successfully',
      character,
      newBalance: user.coins
    });
    
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase character' });
  }
});

// Equip character
router.post('/equip', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user owns this character
    if (!user.inventory.characters.includes(characterId)) {
      return res.status(400).json({ error: 'You do not own this character' });
    }
    
    // Equip character
    user.activeLoadout.character = characterId;
    await user.save();
    
    const character = await Character.findOne({ id: characterId });
    
    res.json({
      message: 'Character equipped successfully',
      character
    });
    
  } catch (error) {
    console.error('Equip error:', error);
    res.status(500).json({ error: 'Failed to equip character' });
  }
});

export default router;