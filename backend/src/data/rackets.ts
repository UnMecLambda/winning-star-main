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
    id: 'amateur-racket',
    name: 'Amateur Racket',
    description: 'A decent racket for casual players',
    basePrice: 1200,
    rarity: 'common' as const,
    baseStats: {
      power: 50,
      control: 55,
      speed: 50,
      durability: 65
    },
    visualConfig: {
      frameColor: '#4169E1',
      frameTexture: 'aluminum',
      handleColor: '#2F4F4F',
      handleTexture: 'rubber'
    },
    isActive: true
  },
  {
    id: 'club-champion',
    name: 'Club Champion',
    description: 'Popular choice among club players',
    basePrice: 2000,
    rarity: 'common' as const,
    baseStats: {
      power: 60,
      control: 60,
      speed: 55,
      durability: 70
    },
    visualConfig: {
      frameColor: '#228B22',
      frameTexture: 'composite',
      handleColor: '#006400',
      handleTexture: 'synthetic'
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
    id: 'precision-master',
    name: 'Precision Master',
    description: 'Engineered for surgical precision',
    basePrice: 3200,
    rarity: 'rare' as const,
    baseStats: {
      power: 55,
      control: 85,
      speed: 65,
      durability: 60
    },
    visualConfig: {
      frameColor: '#9370DB',
      frameTexture: 'graphite',
      handleColor: '#4B0082',
      handleTexture: 'premium_grip'
    },
    isActive: true
  },
  {
    id: 'all-rounder',
    name: 'All-Rounder Pro',
    description: 'Balanced performance in all areas',
    basePrice: 2800,
    rarity: 'rare' as const,
    baseStats: {
      power: 65,
      control: 65,
      speed: 65,
      durability: 65
    },
    visualConfig: {
      frameColor: '#DC143C',
      frameTexture: 'hybrid',
      handleColor: '#8B0000',
      handleTexture: 'textured'
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
    id: 'thunder-strike',
    name: 'Thunder Strike',
    description: 'Unleash devastating power shots',
    basePrice: 4200,
    rarity: 'epic' as const,
    baseStats: {
      power: 95,
      control: 45,
      speed: 55,
      durability: 75
    },
    visualConfig: {
      frameColor: '#FFD700',
      frameTexture: 'titanium',
      handleColor: '#FF8C00',
      handleTexture: 'lightning_grip'
    },
    isActive: true
  },
  {
    id: 'velocity-viper',
    name: 'Velocity Viper',
    description: 'Strike with lightning speed',
    basePrice: 4500,
    rarity: 'epic' as const,
    baseStats: {
      power: 60,
      control: 70,
      speed: 95,
      durability: 55
    },
    visualConfig: {
      frameColor: '#00CED1',
      frameTexture: 'carbon_fiber',
      handleColor: '#008B8B',
      handleTexture: 'viper_skin'
    },
    isActive: true
  },
  {
    id: 'fortress-defender',
    name: 'Fortress Defender',
    description: 'Unbreakable durability and defense',
    basePrice: 4000,
    rarity: 'epic' as const,
    baseStats: {
      power: 65,
      control: 75,
      speed: 50,
      durability: 95
    },
    visualConfig: {
      frameColor: '#2F4F4F',
      frameTexture: 'reinforced_steel',
      handleColor: '#696969',
      handleTexture: 'armor_grip'
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
  },
  {
    id: 'phoenix-wing',
    name: 'Phoenix Wing',
    description: 'Rise from defeat with legendary power',
    basePrice: 12000,
    rarity: 'legendary' as const,
    baseStats: {
      power: 85,
      control: 80,
      speed: 85,
      durability: 70
    },
    visualConfig: {
      frameColor: '#FF6347',
      frameTexture: 'phoenix_feather',
      handleColor: '#FF4500',
      handleTexture: 'flame_wrap'
    },
    isActive: true
  },
  {
    id: 'cosmic-destroyer',
    name: 'Cosmic Destroyer',
    description: 'Harness the power of the cosmos',
    basePrice: 15000,
    rarity: 'legendary' as const,
    baseStats: {
      power: 90,
      control: 85,
      speed: 80,
      durability: 85
    },
    visualConfig: {
      frameColor: '#9400D3',
      frameTexture: 'cosmic_metal',
      handleColor: '#4B0082',
      handleTexture: 'stardust_grip'
    },
    isActive: true
  },
  {
    id: 'infinity-edge',
    name: 'Infinity Edge',
    description: 'The ultimate racket with infinite potential',
    basePrice: 25000,
    rarity: 'legendary' as const,
    baseStats: {
      power: 95,
      control: 95,
      speed: 90,
      durability: 90
    },
    visualConfig: {
      frameColor: '#FFD700',
      frameTexture: 'infinity_crystal',
      handleColor: '#FF69B4',
      handleTexture: 'divine_silk'
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
    id: 'nylon-strings',
    name: 'Nylon Strings',
    description: 'Durable nylon strings for beginners',
    type: 'strings' as const,
    price: 150,
    rarity: 'common' as const,
    effects: {
      durabilityBonus: 5,
      controlBonus: 2
    },
    visualConfig: {
      color: '#F5F5DC',
      texture: 'nylon'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'polyester-strings',
    name: 'Polyester Strings',
    description: 'Professional polyester strings',
    type: 'strings' as const,
    price: 400,
    rarity: 'common' as const,
    effects: {
      spinBonus: 10,
      controlBonus: 4,
      powerBonus: -1
    },
    visualConfig: {
      color: '#FFE4B5',
      texture: 'polyester'
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
    id: 'hybrid-strings',
    name: 'Hybrid Strings',
    description: 'Best of both worlds - power and control',
    type: 'strings' as const,
    price: 800,
    rarity: 'rare' as const,
    effects: {
      powerBonus: 5,
      controlBonus: 5,
      spinBonus: 3
    },
    visualConfig: {
      color: '#9370DB',
      texture: 'hybrid'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'titanium-strings',
    name: 'Titanium Strings',
    description: 'Ultra-durable titanium-infused strings',
    type: 'strings' as const,
    price: 1500,
    rarity: 'epic' as const,
    effects: {
      powerBonus: 12,
      durabilityBonus: 15,
      ballSpeedBonus: 8,
      controlBonus: 3
    },
    visualConfig: {
      color: '#C0C0C0',
      texture: 'titanium'
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
  {
    id: 'cosmic-strings',
    name: 'Cosmic Strings',
    description: 'Strings forged from cosmic energy',
    type: 'strings' as const,
    price: 3000,
    rarity: 'legendary' as const,
    effects: {
      powerBonus: 20,
      controlBonus: 15,
      furyRateBonus: 40,
      ballSpeedBonus: 15,
      spinBonus: 20
    },
    visualConfig: {
      color: '#9400D3',
      texture: 'cosmic'
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
    id: 'wooden-handle',
    name: 'Classic Wood Handle',
    description: 'Traditional wooden handle',
    type: 'handle' as const,
    price: 250,
    rarity: 'common' as const,
    effects: {
      durabilityBonus: 8,
      controlBonus: 2
    },
    visualConfig: {
      color: '#8B4513',
      texture: 'wood'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'aluminum-handle',
    name: 'Aluminum Handle',
    description: 'Lightweight aluminum construction',
    type: 'handle' as const,
    price: 450,
    rarity: 'common' as const,
    effects: {
      speedBonus: 8,
      controlBonus: 3,
      powerBonus: -1
    },
    visualConfig: {
      color: '#C0C0C0',
      texture: 'aluminum'
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
  {
    id: 'balanced-handle',
    name: 'Balanced Handle',
    description: 'Perfect balance of all attributes',
    type: 'handle' as const,
    price: 900,
    rarity: 'rare' as const,
    effects: {
      powerBonus: 6,
      controlBonus: 6,
      speedBonus: 6,
      durabilityBonus: 6
    },
    visualConfig: {
      color: '#4169E1',
      texture: 'composite'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'diamond-handle',
    name: 'Diamond Handle',
    description: 'Luxurious diamond-encrusted handle',
    type: 'handle' as const,
    price: 2500,
    rarity: 'epic' as const,
    effects: {
      powerBonus: 18,
      controlBonus: 12,
      durabilityBonus: 20,
      furyRateBonus: 15
    },
    visualConfig: {
      color: '#B9F2FF',
      texture: 'diamond'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'infinity-handle',
    name: 'Infinity Handle',
    description: 'Handle with infinite potential',
    type: 'handle' as const,
    price: 5000,
    rarity: 'legendary' as const,
    effects: {
      powerBonus: 25,
      controlBonus: 20,
      speedBonus: 15,
      durabilityBonus: 25,
      furyRateBonus: 30
    },
    visualConfig: {
      color: '#FFD700',
      texture: 'infinity'
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
    id: 'cotton-grip',
    name: 'Cotton Grip Tape',
    description: 'Soft cotton grip for comfort',
    type: 'grip_tape' as const,
    price: 120,
    rarity: 'common' as const,
    effects: {
      controlBonus: 3,
      durabilityBonus: 2
    },
    visualConfig: {
      color: '#FFFFFF',
      texture: 'cotton'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'leather-grip',
    name: 'Leather Grip Tape',
    description: 'Premium leather grip',
    type: 'grip_tape' as const,
    price: 350,
    rarity: 'common' as const,
    effects: {
      controlBonus: 4,
      durabilityBonus: 6,
      powerBonus: 1
    },
    visualConfig: {
      color: '#8B4513',
      texture: 'leather'
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
    id: 'anti-slip-grip',
    name: 'Anti-Slip Grip',
    description: 'Never lose your grip again',
    type: 'grip_tape' as const,
    price: 600,
    rarity: 'rare' as const,
    effects: {
      controlBonus: 8,
      speedBonus: 5,
      furyRateBonus: 10
    },
    visualConfig: {
      color: '#00FF00',
      texture: 'anti_slip'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'shock-absorb-grip',
    name: 'Shock Absorbing Grip',
    description: 'Reduces vibration and fatigue',
    type: 'grip_tape' as const,
    price: 750,
    rarity: 'rare' as const,
    effects: {
      controlBonus: 7,
      durabilityBonus: 10,
      powerBonus: 3
    },
    visualConfig: {
      color: '#4169E1',
      texture: 'shock_absorb'
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
  {
    id: 'dragon-scale-grip',
    name: 'Dragon Scale Grip',
    description: 'Grip made from ancient dragon scales',
    type: 'grip_tape' as const,
    price: 2000,
    rarity: 'epic' as const,
    effects: {
      powerBonus: 12,
      controlBonus: 8,
      furyRateBonus: 20,
      ballSpeedBonus: 8
    },
    visualConfig: {
      color: '#8B0000',
      texture: 'dragon_scale',
      pattern: 'scales'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'phoenix-feather-grip',
    name: 'Phoenix Feather Grip',
    description: 'Grip woven from phoenix feathers',
    type: 'grip_tape' as const,
    price: 4000,
    rarity: 'legendary' as const,
    effects: {
      powerBonus: 15,
      controlBonus: 12,
      speedBonus: 10,
      furyRateBonus: 35,
      ballSpeedBonus: 12,
      spinBonus: 15
    },
    visualConfig: {
      color: '#FF6347',
      texture: 'phoenix_feather',
      pattern: 'flames'
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
    id: 'silicone-dampener',
    name: 'Silicone Dampener',
    description: 'Soft silicone for maximum comfort',
    type: 'dampener' as const,
    price: 150,
    rarity: 'common' as const,
    effects: {
      controlBonus: 4,
      durabilityBonus: 3,
      speedBonus: 1
    },
    visualConfig: {
      color: '#87CEEB',
      texture: 'silicone'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'foam-dampener',
    name: 'Memory Foam Dampener',
    description: 'Memory foam for personalized comfort',
    type: 'dampener' as const,
    price: 250,
    rarity: 'common' as const,
    effects: {
      controlBonus: 5,
      durabilityBonus: 4,
      furyRateBonus: 5
    },
    visualConfig: {
      color: '#DDA0DD',
      texture: 'foam'
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
    id: 'speed-dampener',
    name: 'Speed Dampener',
    description: 'Lightweight dampener for speed',
    type: 'dampener' as const,
    price: 400,
    rarity: 'rare' as const,
    effects: {
      speedBonus: 8,
      controlBonus: 4,
      ballSpeedBonus: 5
    },
    visualConfig: {
      color: '#00FF00',
      texture: 'aerogel'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'control-dampener',
    name: 'Control Dampener',
    description: 'Precision-engineered for control',
    type: 'dampener' as const,
    price: 450,
    rarity: 'rare' as const,
    effects: {
      controlBonus: 10,
      spinBonus: 8,
      durabilityBonus: 3
    },
    visualConfig: {
      color: '#0000FF',
      texture: 'precision'
    },
    compatibleRackets: [],
    isActive: true
  },
  {
    id: 'titanium-dampener',
    name: 'Titanium Dampener',
    description: 'Ultra-durable titanium construction',
    type: 'dampener' as const,
    price: 1200,
    rarity: 'epic' as const,
    effects: {
      powerBonus: 10,
      controlBonus: 8,
      durabilityBonus: 15,
      ballSpeedBonus: 6
    },
    visualConfig: {
      color: '#C0C0C0',
      texture: 'titanium'
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
  },
  {
    id: 'quantum-dampener',
    name: 'Quantum Dampener',
    description: 'Harnesses quantum physics for ultimate performance',
    type: 'dampener' as const,
    price: 6000,
    rarity: 'legendary' as const,
    effects: {
      powerBonus: 20,
      controlBonus: 18,
      speedBonus: 15,
      durabilityBonus: 20,
      furyRateBonus: 40,
      ballSpeedBonus: 20,
      spinBonus: 25
    },
    visualConfig: {
      color: '#00FFFF',
      texture: 'quantum'
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