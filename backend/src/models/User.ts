import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  username: string;
  password: string;
  coins: number;
  level: number;
  experience: number;

  // === Manager economy (ajouts) ===
  team?: Types.ObjectId;
  lastEarnAt?: Date;
  earnWindow?: {
    windowStart: Date;
    amount: number;
  };

  avatar: string;
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

    // === Manager economy (ajouts) ===
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    lastEarnAt: { type: Date },
    earnWindow: {
      windowStart: { type: Date },
      amount: { type: Number, default: 0 },
    },

    avatar: {
      type: String,
      default: 'default-avatar.png',
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

// Indexes pour perfs
userSchema.index({ 'stats.totalScore': -1 }); // leaderboard
userSchema.index({ level: -1, experience: -1 }); // classement niveau

export const User = mongoose.model<IUser>('User', userSchema);
