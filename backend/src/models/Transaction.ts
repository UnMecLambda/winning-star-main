import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  type: 'earn' | 'spend' | 'transfer' | 'rental_income' | 'rental_payment' | 'withdrawal' | 'purchase';
  amount: number;
  description: string;
  metadata?: {
    gameId?: string;
    itemId?: string;
    targetUserId?: string;
    stripePaymentId?: string;
    withdrawalId?: string;
  };
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['earn', 'spend', 'transfer', 'rental_income', 'rental_payment', 'withdrawal', 'purchase'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    gameId: { type: String },
    itemId: { type: String },
    targetUserId: { type: String },
    stripePaymentId: { type: String },
    withdrawalId: { type: String }
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ 'metadata.gameId': 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);