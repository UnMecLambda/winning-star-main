import { Schema, model, Types, Document } from 'mongoose';
import { OffTactic, DefTactic } from './Tactics';

export interface IBoxLine {
  player: Types.ObjectId;
  pts: number; reb: number; ast: number; stl: number; blk: number; tov: number; min: number;
}

export type MatchStatus = 'scheduled'|'live'|'finished'|'canceled';

export interface MatchDoc extends Document {
  _id: Types.ObjectId;
  status: MatchStatus;
  home: Types.ObjectId;         // Team
  away: Types.ObjectId;         // Team
  tacticsHome: { offense: OffTactic; defense: DefTactic };
  tacticsAway: { offense: OffTactic; defense: DefTactic };
  scoreHome: number;
  scoreAway: number;
  boxHome: IBoxLine[];
  boxAway: IBoxLine[];
  eloHomeBefore?: number; eloAwayBefore?: number;
  eloHomeAfter?: number;  eloAwayAfter?: number;
  startedAt?: Date;
  finishedAt?: Date;
}

const box = new Schema<IBoxLine>({
  player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  pts: Number, reb: Number, ast: Number, stl: Number, blk: Number, tov: Number, min: Number
}, { _id: false });

const MatchSchema = new Schema<MatchDoc>({
  status: { type: String, enum: ['scheduled','live','finished','canceled'], default: 'scheduled' },
  home:   { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  away:   { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  tacticsHome: {
    offense: { type: String, required: true },
    defense: { type: String, required: true }
  },
  tacticsAway: {
    offense: { type: String, required: true },
    defense: { type: String, required: true }
  },
  scoreHome: { type: Number, default: 0 },
  scoreAway: { type: Number, default: 0 },
  boxHome: [box],
  boxAway: [box],
  eloHomeBefore: Number, eloAwayBefore: Number,
  eloHomeAfter: Number,  eloAwayAfter: Number,
  startedAt: Date,
  finishedAt: Date
}, { timestamps: true });

MatchSchema.index({ status: 1, createdAt: -1 });

export const Match = model<MatchDoc>('Match', MatchSchema);
