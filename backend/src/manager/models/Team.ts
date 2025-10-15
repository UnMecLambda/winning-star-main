import mongoose, { Schema, Types, Document, Model } from 'mongoose';

export type Pos = 'PG'|'SG'|'SF'|'PF'|'C';

export interface ITactics {
  offense: { fastBreak: number; ballMovement: number; isolation: number };
  defense: { man: number; zone: number; pressure: number };
}

export interface ITeam extends Document {
  _id: Types.ObjectId;
  owner?: Types.ObjectId;            // ← optionnel (user) ; absent pour IA
  isAI: boolean;                     // ← flag IA
  name: string;
  roster: Types.ObjectId[];          // ref Player
  starters: Types.ObjectId[];        // ref Player (5)
  tactics?: ITactics;
  createdAt: Date;
  updatedAt: Date;
}

const TacticsSchema = new Schema<ITactics>({
  offense: {
    fastBreak:   { type: Number, default: 50, min: 0, max: 100 },
    ballMovement:{ type: Number, default: 50, min: 0, max: 100 },
    isolation:   { type: Number, default: 50, min: 0, max: 100 },
  },
  defense: {
    man:      { type: Number, default: 60, min: 0, max: 100 },
    zone:     { type: Number, default: 40, min: 0, max: 100 },
    pressure: { type: Number, default: 50, min: 0, max: 100 },
  }
}, { _id: false });

const TeamSchema = new Schema<ITeam>({
  owner:   { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true }, // ← plus required
  isAI:    { type: Boolean, default: false, index: true },                              // ← flag IA
  name:    { type: String, required: true, trim: true },
  roster:  [{ type: Schema.Types.ObjectId, ref: 'Player', required: true, default: [] }],
  starters:[{ type: Schema.Types.ObjectId, ref: 'Player', required: true, default: [] }],
  tactics: { type: TacticsSchema, required: false },
}, { timestamps: true });

TeamSchema.index({ owner: 1 });
TeamSchema.index({ isAI: 1, name: 1 });

export const Team: Model<ITeam> = mongoose.model<ITeam>('Team', TeamSchema);
