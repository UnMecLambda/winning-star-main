import mongoose, { Document, Schema } from 'mongoose';

export interface IRacketComponent extends Document {
  id: string;
  name: string;
  description: string;
  type: 'strings' | 'handle' | 'grip_tape' | 'dampener';
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effects: {
    powerBonus?: number;
    controlBonus?: number;
    speedBonus?: number;
    durabilityBonus?: number;
    furyRateBonus?: number;
    ballSpeedBonus?: number;
    spinBonus?: number;
  };
  visualConfig: {
    color: string;
    texture: string;
    pattern?: string;
  };
  compatibleRackets: string[]; // Empty array means compatible with all
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const racketComponentSchema = new Schema<IRacketComponent>({
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
    enum: ['strings', 'handle', 'grip_tape', 'dampener'],
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
  effects: {
    powerBonus: { type: Number, default: 0 },
    controlBonus: { type: Number, default: 0 },
    speedBonus: { type: Number, default: 0 },
    durabilityBonus: { type: Number, default: 0 },
    furyRateBonus: { type: Number, default: 0 },
    ballSpeedBonus: { type: Number, default: 0 },
    spinBonus: { type: Number, default: 0 }
  },
  visualConfig: {
    color: { type: String, required: true },
    texture: { type: String, required: true },
    pattern: { type: String }
  },
  compatibleRackets: [{ type: String }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

racketComponentSchema.index({ type: 1, rarity: 1, isActive: 1 });

export const RacketComponent = mongoose.model<IRacketComponent>('RacketComponent', racketComponentSchema);