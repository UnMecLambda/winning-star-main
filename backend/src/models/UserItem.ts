import mongoose, { Document, Schema } from 'mongoose';

export interface IUserItem extends Document {
  userId: string;
  itemId: string;
  durability: number;
  maxDurability: number;
  purchaseDate: Date;
  isRented: boolean;
  rentedTo?: string;
  rentPrice?: number;
  rentDuration?: number;
  rentExpiresAt?: Date;
  totalEarnings: number;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userItemSchema = new Schema<IUserItem>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  itemId: {
    type: String,
    required: true,
    ref: 'Item'
  },
  durability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  maxDurability: {
    type: Number,
    required: true,
    default: 100
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  isRented: {
    type: Boolean,
    default: false
  },
  rentedTo: {
    type: String,
    ref: 'User'
  },
  rentPrice: {
    type: Number,
    min: 0
  },
  rentDuration: {
    type: Number, // in hours
    min: 1
  },
  rentExpiresAt: {
    type: Date
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes
userItemSchema.index({ userId: 1, itemId: 1 });
userItemSchema.index({ isRented: 1, rentExpiresAt: 1 });
userItemSchema.index({ userId: 1, durability: 1 });

export const UserItem = mongoose.model<IUserItem>('UserItem', userItemSchema);