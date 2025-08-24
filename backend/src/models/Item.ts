import mongoose, { Document, Schema } from 'mongoose';

export interface IItem extends Document {
  id: string;
  name: string;
  description: string;
  type: 'racket' | 'skin' | 'character' | 'equipment';
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number; // In coins
  fiatPrice?: number; // In euros (for premium items)
  stats: {
    power?: number;
    speed?: number;
    durability?: number;
    special?: string;
  };
  effects: {
    ballSpeed?: number;
    ballEffect?: string;
    durabilityBonus?: number;
    experienceBonus?: number;
  };
  image: string;
  isLimited: boolean;
  limitedQuantity?: number;
  availableFrom?: Date;
  availableUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['racket', 'skin', 'character', 'equipment'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  fiatPrice: {
    type: Number,
    min: 0
  },
  stats: {
    power: { type: Number, min: 0, max: 100 },
    speed: { type: Number, min: 0, max: 100 },
    durability: { type: Number, min: 0, max: 100 },
    special: { type: String }
  },
  effects: {
    ballSpeed: { type: Number },
    ballEffect: { type: String },
    durabilityBonus: { type: Number },
    experienceBonus: { type: Number }
  },
  image: {
    type: String,
    required: true
  },
  isLimited: {
    type: Boolean,
    default: false
  },
  limitedQuantity: {
    type: Number
  },
  availableFrom: {
    type: Date
  },
  availableUntil: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
itemSchema.index({ type: 1, isActive: 1 });
itemSchema.index({ rarity: 1 });
itemSchema.index({ isLimited: 1, availableUntil: 1 });

export const Item = mongoose.model<IItem>('Item', itemSchema);