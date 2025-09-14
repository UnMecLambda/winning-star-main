import { Character } from '../models/Character';

export const defaultCharacters = [
  {
    id: 'amara',
    name: 'Amara',
    description: 'A skilled tennis player with great agility',
    price: 0, // Gratuit
    rarity: 'common' as const,
    imagePath: '/assets/players/amara.png',
    stats: {
      speed: 70,
      agility: 80,
      stamina: 65,
      luck: 60
    },
    effects: {
      speedBonus: 5,
      furyRateBonus: 0,
      experienceBonus: 0
    },
    isActive: true
  },
  {
    id: 'stan',
    name: 'Stan',
    description: 'A fun character from South Park universe',
    price: 0, // Gratuit
    rarity: 'common' as const,
    imagePath: '/assets/players/stan.png',
    stats: {
      speed: 60,
      agility: 70,
      stamina: 75,
      luck: 85
    },
    effects: {
      speedBonus: 0,
      furyRateBonus: 10,
      experienceBonus: 5
    },
    isActive: true
  },
  {
    id: 'pro-player',
    name: 'Pro Player',
    description: 'Professional tennis player with balanced stats',
    price: 2500,
    rarity: 'rare' as const,
    imagePath: '/assets/players/pro-player.png',
    stats: {
      speed: 85,
      agility: 85,
      stamina: 80,
      luck: 70
    },
    effects: {
      speedBonus: 10,
      furyRateBonus: 5,
      experienceBonus: 10
    },
    isActive: true
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Elite tennis champion with exceptional abilities',
    price: 5000,
    rarity: 'epic' as const,
    imagePath: '/assets/players/champion.png',
    stats: {
      speed: 90,
      agility: 95,
      stamina: 85,
      luck: 80
    },
    effects: {
      speedBonus: 15,
      furyRateBonus: 15,
      experienceBonus: 20
    },
    isActive: true
  },
  {
    id: 'legend',
    name: 'Tennis Legend',
    description: 'Legendary player with unmatched skills',
    price: 10000,
    rarity: 'legendary' as const,
    imagePath: '/assets/players/legend.png',
    stats: {
      speed: 95,
      agility: 100,
      stamina: 90,
      luck: 95
    },
    effects: {
      speedBonus: 25,
      furyRateBonus: 30,
      experienceBonus: 50
    },
    isActive: true
  }
];

export async function seedCharacterData() {
  try {
    // Clear existing data
    await Character.deleteMany({});
    
    // Insert characters
    await Character.insertMany(defaultCharacters);
    console.log('✅ Characters seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding character data:', error);
  }
}