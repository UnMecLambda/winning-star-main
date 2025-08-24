import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Racket } from '../models/Racket';
import { RacketComponent } from '../models/RacketComponent';
import { UserRacket } from '../models/UserRacket';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';

const router = express.Router();

// Get all available rackets
router.get('/shop', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const rackets = await Racket.find({ isActive: true }).sort({ rarity: 1, basePrice: 1 });
    res.json(rackets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rackets' });
  }
});

// Get all available components
router.get('/components', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { type } = req.query;
    const filter: any = { isActive: true };
    if (type) filter.type = type;
    
    const components = await RacketComponent.find(filter).sort({ type: 1, rarity: 1, price: 1 });
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch components' });
  }
});

// Get user's rackets
router.get('/my-rackets', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userRackets = await UserRacket.find({ userId: req.user._id })
      .populate('racketId')
      .populate('customization.strings')
      .populate('customization.handle')
      .populate('customization.gripTape')
      .populate('customization.dampener')
      .sort({ isEquipped: -1, purchaseDate: -1 });
    
    res.json(userRackets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user rackets' });
  }
});

// Purchase a racket
router.post('/purchase', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { racketId } = req.body;
    
    const racket = await Racket.findOne({ id: racketId, isActive: true });
    if (!racket) {
      return res.status(404).json({ error: 'Racket not found' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.coins < racket.basePrice) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    // Check if user already owns this racket
    const existingRacket = await UserRacket.findOne({ userId: req.user._id, racketId });
    if (existingRacket) {
      return res.status(400).json({ error: 'You already own this racket' });
    }
    
    // Calculate total stats (base racket stats only for now)
    const totalStats = {
      power: racket.baseStats.power,
      control: racket.baseStats.control,
      speed: racket.baseStats.speed,
      durability: racket.baseStats.durability,
      furyRate: 1,
      ballSpeed: 1,
      spin: 1
    };
    
    // Create user racket
    const userRacket = new UserRacket({
      userId: req.user._id,
      racketId: racket.id,
      customization: {},
      totalStats,
      isEquipped: false
    });
    
    // Deduct coins
    user.coins -= racket.basePrice;
    
    // Create transaction
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'purchase',
      amount: -racket.basePrice,
      description: `Purchased racket: ${racket.name}`,
      metadata: { racketId: racket.id },
      balanceBefore: user.coins + racket.basePrice,
      balanceAfter: user.coins
    });
    
    await Promise.all([
      userRacket.save(),
      user.save(),
      transaction.save()
    ]);
    
    res.json({
      message: 'Racket purchased successfully',
      racket: userRacket,
      newBalance: user.coins
    });
    
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase racket' });
  }
});

// Purchase a component
router.post('/purchase-component', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { componentId } = req.body;
    
    const component = await RacketComponent.findOne({ id: componentId, isActive: true });
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.coins < component.price) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    // Add component to user's inventory
    const componentType = component.type === 'grip_tape' ? 'gripTape' : component.type;
    if (!user.inventory.equipment) user.inventory.equipment = [];
    user.inventory.equipment.push(component.id);
    
    // Deduct coins
    user.coins -= component.price;
    
    // Create transaction
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'purchase',
      amount: -component.price,
      description: `Purchased component: ${component.name}`,
      metadata: { componentId: component.id },
      balanceBefore: user.coins + component.price,
      balanceAfter: user.coins
    });
    
    await Promise.all([
      user.save(),
      transaction.save()
    ]);
    
    res.json({
      message: 'Component purchased successfully',
      component,
      newBalance: user.coins
    });
    
  } catch (error) {
    console.error('Component purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase component' });
  }
});

// Customize racket
router.post('/customize', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userRacketId, customization } = req.body;
    
    const userRacket = await UserRacket.findOne({ 
      _id: userRacketId, 
      userId: req.user._id 
    }).populate('racketId');
    
    if (!userRacket) {
      return res.status(404).json({ error: 'Racket not found' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify user owns all components
    const componentIds = Object.values(customization).filter(Boolean) as string[];
    const ownedComponents = user.inventory.equipment || [];
    
    for (const componentId of componentIds) {
      if (!ownedComponents.includes(componentId)) {
        return res.status(400).json({ error: `You don't own component: ${componentId}` });
      }
    }
    
    // Get all components to calculate new stats
    const components = await RacketComponent.find({ 
      id: { $in: componentIds },
      isActive: true 
    });
    
    // Calculate new total stats
    const baseRacket = userRacket.racketId as any;
    let totalStats = {
      power: baseRacket.baseStats.power,
      control: baseRacket.baseStats.control,
      speed: baseRacket.baseStats.speed,
      durability: baseRacket.baseStats.durability,
      furyRate: 1,
      ballSpeed: 1,
      spin: 1
    };
    
    // Apply component bonuses
    components.forEach(component => {
      totalStats.power += component.effects.powerBonus || 0;
      totalStats.control += component.effects.controlBonus || 0;
      totalStats.speed += component.effects.speedBonus || 0;
      totalStats.durability += component.effects.durabilityBonus || 0;
      totalStats.furyRate += (component.effects.furyRateBonus || 0) / 100;
      totalStats.ballSpeed += (component.effects.ballSpeedBonus || 0) / 100;
      totalStats.spin += (component.effects.spinBonus || 0) / 100;
    });
    
    // Cap stats at reasonable limits
    totalStats.power = Math.min(150, Math.max(0, totalStats.power));
    totalStats.control = Math.min(150, Math.max(0, totalStats.control));
    totalStats.speed = Math.min(150, Math.max(0, totalStats.speed));
    totalStats.durability = Math.min(150, Math.max(0, totalStats.durability));
    totalStats.furyRate = Math.min(3, Math.max(0.5, totalStats.furyRate));
    totalStats.ballSpeed = Math.min(2, Math.max(0.5, totalStats.ballSpeed));
    totalStats.spin = Math.min(3, Math.max(0.5, totalStats.spin));
    
    // Update racket
    userRacket.customization = customization;
    userRacket.totalStats = totalStats;
    
    await userRacket.save();
    
    res.json({
      message: 'Racket customized successfully',
      racket: userRacket
    });
    
  } catch (error) {
    console.error('Customization error:', error);
    res.status(500).json({ error: 'Failed to customize racket' });
  }
});

// Equip racket
router.post('/equip', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userRacketId } = req.body;
    
    // Unequip all rackets
    await UserRacket.updateMany(
      { userId: req.user._id },
      { isEquipped: false }
    );
    
    // Equip selected racket
    const userRacket = await UserRacket.findOneAndUpdate(
      { _id: userRacketId, userId: req.user._id },
      { isEquipped: true },
      { new: true }
    ).populate('racketId');
    
    if (!userRacket) {
      return res.status(404).json({ error: 'Racket not found' });
    }
    
    res.json({
      message: 'Racket equipped successfully',
      racket: userRacket
    });
    
  } catch (error) {
    console.error('Equip error:', error);
    res.status(500).json({ error: 'Failed to equip racket' });
  }
});

export default router;