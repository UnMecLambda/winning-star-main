import mongoose, { Document, Schema } from 'mongoose';

export interface IUserRacket extends Document {
  userId: string;
  racketId: string;
  customization: {
    strings?: string;
    handle?: string;
    gripTape?: string;
    dampener?: string;
  };
  durability: number;
  maxDurability: number;
  totalStats: {
    power: number;
    control: number;
    speed: number;
    durability: number;
    furyRate: number;
    ballSpeed: number;
    spin: number;
  };
  gamesPlayed: number;
  isEquipped: boolean;
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userRacketSchema = new Schema<IUserRacket>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  racketId: {
    type: String,
    required: true,
    ref: 'Racket'
  },
  customization: {
    strings: { type: String, ref: 'RacketComponent' },
    handle: { type: String, ref: 'RacketComponent' },
    gripTape: { type: String, ref: 'RacketComponent' },
    dampener: { type: String, ref: 'RacketComponent' }
  },
  durability: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 100
  },
  maxDurability: {
    type: Number,
    required: true,
    default: 100
  },
  totalStats: {
    power: { type: Number, required: true },
    control: { type: Number, required: true },
    speed: { type: Number, required: true },
    durability: { type: Number, required: true },
    furyRate: { type: Number, default: 1 },
    ballSpeed: { type: Number, default: 1 },
    spin: { type: Number, default: 1 }
  },
  gamesPlayed: {
    type: Number,
    default: 0
  },
  isEquipped: {
    type: Boolean,
    default: false
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userRacketSchema.index({ userId: 1, isEquipped: 1 });
userRacketSchema.index({ userId: 1, racketId: 1 });

export const UserRacket = mongoose.model<IUserRacket>('UserRacket', userRacketSchema);