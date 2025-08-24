import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId; // ✅ important pour que TS reconnaisse _id
  email: string;
  username: string;
  password: string;
  coins: number;
  level: number;
  experience: number;
  avatar: string;
  isHandedness: 'left' | 'right';
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    winStreak: number;
    bestWinStreak: number;
  };
  inventory: {
    rackets: string[];
    skins: string[];
    characters: string[];
    equipment: string[];
  };
  activeLoadout: {
    racket?: string;
    character?: string;
    skin?: string;
    equipment: string[];
  };
  preferences: {
    notifications: boolean;
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  withdrawalLimits: {
    daily: number;
    monthly: number;
    dailyUsed: number;
    monthlyUsed: number;
    lastReset: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    coins: {
      type: Number,
      default: 1000,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    avatar: {
      type: String,
      default: 'default-avatar.png',
    },
    isHandedness: {
      type: String,
      enum: ['left', 'right'],
      default: 'right',
    },
    stats: {
      gamesPlayed: { type: Number, default: 0 },
      gamesWon: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      winStreak: { type: Number, default: 0 },
      bestWinStreak: { type: Number, default: 0 },
    },
    inventory: {
      rackets: [{ type: String }],
      skins: [{ type: String }],
      characters: [{ type: String }],
      equipment: [{ type: String }],
    },
    activeLoadout: {
      racket: { type: String },
      character: { type: String },
      skin: { type: String },
      equipment: [{ type: String }],
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
      musicEnabled: { type: Boolean, default: true },
    },
    kycStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none',
    },
    withdrawalLimits: {
      daily: { type: Number, default: 100 },
      monthly: { type: Number, default: 500 },
      dailyUsed: { type: Number, default: 0 },
      monthlyUsed: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now },
    },
    lastLogin: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
// userSchema.index({ email: 1 });
// userSchema.index({ username: 1 });
userSchema.index({ 'stats.totalScore': -1 }); // Leaderboard
userSchema.index({ level: -1, experience: -1 }); // Level ranking

export const User = mongoose.model<IUser>('User', userSchema);
