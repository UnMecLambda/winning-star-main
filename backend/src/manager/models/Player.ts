import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { Pos } from './Team';

export interface IPlayer extends Document {
  _id: Types.ObjectId;
  name: string;
  position: Pos; // 'PG' | 'SG' | 'SF' | 'PF' | 'C'
  ratingOff: number;
  ratingDef: number;
  ratingReb: number;
  speed: number;
  pass: number;
  dribble: number;
  threePt: number;
  stamina: number;
  price: number;
  age: number;
  potential: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, trim: true },
    position: {
      type: String,
      required: true,
      enum: ['PG', 'SG', 'SF', 'PF', 'C'],
    },
    ratingOff: { type: Number, required: true },
    ratingDef: { type: Number, required: true },
    ratingReb: { type: Number, required: true },
    speed: { type: Number, required: true },
    pass: { type: Number, required: true },
    dribble: { type: Number, required: true },
    threePt: { type: Number, required: true },
    stamina: { type: Number, required: true },
    price: { type: Number, required: true },
    age: { type: Number, default: 20 },
    potential: { type: Number, default: 70 },
  },
  { timestamps: true }
);

PlayerSchema.index({ position: 1 });
PlayerSchema.index({ price: 1 });
PlayerSchema.index({ potential: -1 });

export const Player: Model<IPlayer> = mongoose.model<IPlayer>('Player', PlayerSchema);

// ✅ pour compatibilité avec les anciens fichiers
export type PlayerDoc = IPlayer;
