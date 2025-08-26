import mongoose, { Document, Schema } from 'mongoose';

export interface IRacket extends Document {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  imagePath?: string; // Path to racket PNG image
  baseStats: {
    power: number;
    control: number;
    speed: number;
    durability: number;
  };
  visualConfig: {
    frameColor: string;
    frameTexture: string;
    handleColor: string;
    handleTexture: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const racketSchema = new Schema<IRacket>({
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
  basePrice: {
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
    type: String
  },
  baseStats: {
    power: { type: Number, required: true, min: 0, max: 100 },
    control: { type: Number, required: true, min: 0, max: 100 },
    speed: { type: Number, required: true, min: 0, max: 100 },
    durability: { type: Number, required: true, min: 0, max: 100 }
  },
  visualConfig: {
    frameColor: { type: String, required: true },
    frameTexture: { type: String, required: true },
    handleColor: { type: String, required: true },
    handleTexture: { type: String, required: true }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

racketSchema.index({ rarity: 1, isActive: 1 });

export const Racket = mongoose.model<IRacket>('Racket', racketSchema);