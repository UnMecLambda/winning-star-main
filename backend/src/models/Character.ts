import mongoose, { Document, Schema } from 'mongoose';

export interface ICharacter extends Document {
  id: string;
  name: string;
  description: string;
  price: number; // 0 = gratuit
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  imagePath: string;
  stats: {
    speed: number;
    agility: number;
    stamina: number;
    luck: number;
  };
  effects: {
    speedBonus?: number;
    furyRateBonus?: number;
    experienceBonus?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const characterSchema = new Schema<ICharacter>({
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: true
  },
  imagePath: {
    type: String,
    required: true
  },
  stats: {
    speed: { type: Number, required: true, min: 0, max: 100 },
    agility: { type: Number, required: true, min: 0, max: 100 },
    stamina: { type: Number, required: true, min: 0, max: 100 },
    luck: { type: Number, required: true, min: 0, max: 100 }
  },
  effects: {
    speedBonus: { type: Number, default: 0 },
    furyRateBonus: { type: Number, default: 0 },
    experienceBonus: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

characterSchema.index({ rarity: 1, isActive: 1 });

export const Character = mongoose.model<ICharacter>('Character', characterSchema);