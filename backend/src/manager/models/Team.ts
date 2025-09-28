import { Schema, model, Types, Document } from 'mongoose';
import { DEFAULT_DEF, DEFAULT_OFF, Tactics } from './Tactics';

export interface TeamDoc extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  name: string;
  roster: Types.ObjectId[];
  starters: Types.ObjectId[];
  tactics: Tactics;
}

const TeamSchema = new Schema<TeamDoc>({
  owner:   { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  name:    { type: String, default: 'My Team' },
  roster:  [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  starters:[{ type: Schema.Types.ObjectId, ref: 'Player' }],
  tactics: {
    offense: { type: String, enum: ['fast_break','ball_movement','isolation','pick_and_roll','post_up','pace_and_space'], default: DEFAULT_OFF },
    defense: { type: String, enum: ['man_to_man','zone_23','zone_32','switch_all','drop','full_court_press'], default: DEFAULT_DEF }
  }
}, { timestamps: true });

export const Team = model<TeamDoc>('Team', TeamSchema);
