import { Racket } from '../models/Racket';
import { RacketComponent } from '../models/RacketComponent';

export const defaultRackets = [
  {
    id: 'starter-racket',
    name: 'Starter Racket',
    description: 'A basic racket perfect for beginners',
    basePrice: 0,
    rarity: 'common' as const,
    baseStats: {
      power: 40,
      control: 50,
      speed: 45,
      durability: 60
    },
    visualConfig: {
      frameColor: '#8B4513',
      frameTexture: 'wood',
      handleColor: '#654321',
      handleTexture: 'leather'
    },
    isActive: true
  },
  {
    id: 'power-pro',
    name: 'Power Pro',
    description: 'Heavy racket designed for powerful shots',
    basePrice: 2500,
    rarity: 'rare' as const,
    baseStats: {
      power: 80,
      control: 35,
      speed: 30,
      durability: 70
    },
    visualConfig: {
      frameColor: '#FF4500',
      frameTexture: 'carbon',
      handleColor: '#000000',
      handleTexture: 'grip'
    },
    isActive: true
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Lightweight racket for quick reactions',
    basePrice: 3000,
    rarity: 'rare' as const,
    baseStats: {
      power: 45,
      control: 60,
      speed: 85,
      durability: 50
    },
    visualConfig: {
      frameColor: '#00FF00',
      frameTexture: 'aluminum',
      handleColor: '#FFFFFF',
      handleTexture: 'synthetic'
    },
    isActive: true
  },
  {
    id: 'control-master',
    name: 'Control Master',
    description: 'Precision racket for accurate shots',
    basePrice: 3500,
    rarity: 'epic' as const,
    baseStats: {
      power: 55,
      control: 90,
      speed: 60,
      durability: 65
    },
    visualConfig: {
      frameColor: '#4169E1',
      frameTexture: 'graphite',
      handleColor: '#FFD700',
      handleTexture: 'premium_leather'
    },
    isActive: true
  },
  {
    id: 'fury-blade',
    name: 'Fury Blade',
    description: 'Legendary racket that builds fury faster',
    basePrice: 8000,
    rarity: 'legendary' as const,
    baseStats: {
      power: 75,
      control: 75,
      speed: 70,
      durability: 80
    },
    visualConfig: {
      frameColor: '#FF0000',
      frameTexture: 'titanium',
      handleColor: '#8B0000',
      handleTexture: 'dragon_scale'
    },
    isActive: true
  }
];

export const defaultComponents = [
  // Strings
  {
    id: 'basic-strings',
    name: 'Basic Strings',
    description: 'Standard synthetic strings',
    type: 'strings' as const,
    price: 200,
    rarity: 'common' as const,
    effects: {
      powerBonus: 2,
      controlBonus: 1
    },
    visualConfig: {
      color: '#FFFFFF',
      texture: 'synthetic'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'power-strings',
    name: 'Power Strings',
    description: 'Thick strings for maximum power',
    type: 'strings' as const,
    price: 500,
    rarity: 'rare' as const,
    effects: {
      powerBonus: 8,
      ballSpeedBonus: 5,
      controlBonus: -2
    },
    visualConfig: {
      color: '#FF4500',
      texture: 'thick'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'control-strings',
    name: 'Control Strings',
    description: 'Thin strings for precise control',
    type: 'strings' as const,
    price: 600,
    rarity: 'rare' as const,
    effects: {
      controlBonus: 10,
      spinBonus: 8,
      powerBonus: -3
    },
    visualConfig: {
      color: '#0000FF',
      texture: 'thin'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'fury-strings',
    name: 'Fury Strings',
    description: 'Special strings that build fury faster',
    type: 'strings' as const,
    price: 1200,
    rarity: 'epic' as const,
    effects: {
      furyRateBonus: 25,
      powerBonus: 5,
      speedBonus: 3
    },
    visualConfig: {
      color: '#FFD700',
      texture: 'metallic'
    },
    compatibleRackets: [],
    isActive: true
  },
  
  // Handles
  {
    id: 'comfort-handle',
    name: 'Comfort Handle',
    description: 'Ergonomic handle for better grip',
    type: 'handle' as const,
    price: 300,
    rarity: 'common' as const,
    effects: {
      controlBonus: 3,
      durabilityBonus: 5
    },
    visualConfig: {
      color: '#8B4513',
      texture: 'rubber'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'speed-handle',
    name: 'Speed Handle',
    description: 'Lightweight handle for quick swings',
    type: 'handle' as const,
    price: 700,
    rarity: 'rare' as const,
    effects: {
      speedBonus: 12,
      controlBonus: 5,
      powerBonus: -2
    },
    visualConfig: {
      color: '#FFFFFF',
      texture: 'carbon_fiber'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'power-handle',
    name: 'Power Handle',
    description: 'Heavy handle for powerful shots',
    type: 'handle' as const,
    price: 800,
    rarity: 'rare' as const,
    effects: {
      powerBonus: 15,
      durabilityBonus: 8,
      speedBonus: -5
    },
    visualConfig: {
      color: '#000000',
      texture: 'metal'
    },
    compatibleRackets: [],
    isActive: true
  },
  
  // Grip Tapes
  {
    id: 'basic-grip',
    name: 'Basic Grip Tape',
    description: 'Standard grip tape',
    type: 'grip_tape' as const,
    price: 150,
    rarity: 'common' as const,
    effects: {
      controlBonus: 2
    },
    visualConfig: {
      color: '#000000',
      texture: 'standard'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'pro-grip',
    name: 'Pro Grip Tape',
    description: 'Professional grade grip tape',
    type: 'grip_tape' as const,
    price: 400,
    rarity: 'rare' as const,
    effects: {
      controlBonus: 6,
      speedBonus: 3
    },
    visualConfig: {
      color: '#FF0000',
      texture: 'textured'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'fury-grip',
    name: 'Fury Grip Tape',
    description: 'Grip tape that enhances fury generation',
    type: 'grip_tape' as const,
    price: 900,
    rarity: 'epic' as const,
    effects: {
      furyRateBonus: 15,
      controlBonus: 4,
      spinBonus: 5
    },
    visualConfig: {
      color: '#FFD700',
      texture: 'premium',
      pattern: 'lightning'
    },
    compatibleRackets: [],
    isActive: true
  },
  
  // Dampeners
  {
    id: 'basic-dampener',
    name: 'Basic Dampener',
    description: 'Reduces vibration for better control',
    type: 'dampener' as const,
    price: 100,
    rarity: 'common' as const,
    effects: {
      controlBonus: 3,
      durabilityBonus: 2
    },
    visualConfig: {
      color: '#FFFFFF',
      texture: 'rubber'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'power-dampener',
    name: 'Power Dampener',
    description: 'Dampener that enhances power transfer',
    type: 'dampener' as const,
    price: 350,
    rarity: 'rare' as const,
    effects: {
      powerBonus: 6,
      ballSpeedBonus: 3,
      controlBonus: 2
    },
    visualConfig: {
      color: '#FF4500',
      texture: 'gel'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'legendary-dampener',
    name: 'Legendary Dampener',
    description: 'Ultimate dampener with all-around bonuses',
    type: 'dampener' as const,
    price: 2000,
    rarity: 'legendary' as const,
    effects: {
      powerBonus: 8,
      controlBonus: 8,
      speedBonus: 5,
      furyRateBonus: 10,
      ballSpeedBonus: 5,
      spinBonus: 8
    },
    visualConfig: {
      color: '#9400D3',
      texture: 'crystal'
    },
    compatibleRackets: [],
    isActive: true
  }
];

export async function seedRacketData() {
  try {
    // Clear existing data
    await Racket.deleteMany({});
    await RacketComponent.deleteMany({});
    
    // Insert rackets
    await Racket.insertMany(defaultRackets);
    console.log('✅ Rackets seeded successfully');
    
    // Insert components
    await RacketComponent.insertMany(defaultComponents);
    console.log('✅ Racket components seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding racket data:', error);
  }
}