import { Schema, model, Types, Document } from 'mongoose';

export interface PlayerDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  position: 'PG'|'SG'|'SF'|'PF'|'C';
  // notes principales
  ratingOff: number;
  ratingDef: number;
  ratingReb: number;
  // notes bonus
  speed: number;
  pass: number;
  dribble: number;
  threePt: number;
  stamina: number;

  // NOUVEAU
  age: number;       // 16–40
  potential: number; // 50–99

  price: number;     // calculée via service de valeur
}

const PlayerSchema = new Schema<PlayerDoc>({
  name: { type: String, required: true },
  position: { type: String, enum: ['PG','SG','SF','PF','C'], required: true },

  ratingOff: { type: Number, min: 1, max: 99, required: true },
  ratingDef: { type: Number, min: 1, max: 99, required: true },
  ratingReb: { type: Number, min: 1, max: 99, required: true },

  speed:   { type: Number, min: 1, max: 99, default: 70 },
  pass:    { type: Number, min: 1, max: 99, default: 70 },
  dribble: { type: Number, min: 1, max: 99, default: 70 },
  threePt: { type: Number, min: 1, max: 99, default: 70 },
  stamina: { type: Number, min: 1, max: 99, default: 75 },

  // NOUVEAU
  age: { type: Number, min: 16, max: 40, default: 24 },
  potential: { type: Number, min: 50, max: 99, default: 80 },

  price: { type: Number, min: 0, required: true },
}, { timestamps: true });

export const Player = model<PlayerDoc>('Player', PlayerSchema);
