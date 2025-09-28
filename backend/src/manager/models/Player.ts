import { Schema, model, Types, Document } from 'mongoose';

export interface PlayerDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  position: 'PG'|'SG'|'SF'|'PF'|'C';
  ratingOff: number;
  ratingDef: number;
  ratingReb: number;
  price: number;

  // stats bonus
  speed: number;    // 1-99
  pass: number;     // 1-99
  dribble: number;  // 1-99
  threePt: number;  // 1-99
  stamina: number;  // 1-99
}

const PlayerSchema = new Schema<PlayerDoc>({
  name: { type: String, required: true },
  position: { type: String, enum: ['PG','SG','SF','PF','C'], required: true },
  ratingOff: { type: Number, min: 1, max: 99, required: true },
  ratingDef: { type: Number, min: 1, max: 99, required: true },
  ratingReb: { type: Number, min: 1, max: 99, required: true },
  price:     { type: Number, min: 0, required: true },

  speed:   { type: Number, min: 1, max: 99, default: 70 },
  pass:    { type: Number, min: 1, max: 99, default: 70 },
  dribble: { type: Number, min: 1, max: 99, default: 70 },
  threePt: { type: Number, min: 1, max: 99, default: 70 },
  stamina: { type: Number, min: 1, max: 99, default: 75 },
}, { timestamps: true });

export const Player = model<PlayerDoc>('Player', PlayerSchema);
