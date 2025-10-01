// backend/src/manager/models/hooks.player.ts (optionnel)
import { Player } from './Player';
import { computeMarketValue } from '../services/playerDev';
Player.schema.pre('save', function(next){
  // @ts-ignore
  this.price = computeMarketValue(this);
  next();
});
