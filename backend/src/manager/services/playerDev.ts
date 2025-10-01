import { Player, PlayerDoc } from '../models/Player';

const clamp = (n:number,a=1,b=99)=>Math.max(a,Math.min(b,n));
const overall = (p: PlayerDoc) =>
  Math.round(
    p.ratingOff*0.35 + p.ratingDef*0.25 + p.ratingReb*0.15 +
    p.threePt*0.1 + p.dribble*0.075 + p.pass*0.075
  );

export function computeMarketValue(p: PlayerDoc) {
  const ov = overall(p);
  // prime jeunesse + potentiel
  const youth = p.age <= 24 ? (26 - p.age) * 8 : p.age >= 30 ? - (p.age - 29) * 6 : 0;
  const pot   = (p.potential - ov) * 3; // “headroom”
  const star  = Math.max(0, ov - 85) * 10;
  const val   = ov*8 + youth + pot + star;
  return Math.max(120, Math.round(val/5)*5);
}

/** tick saison : progression (ou déclin) basée sur l’âge et l’écart potentiel */
export function seasonProgress(p: PlayerDoc) {
  const ov = overall(p);
  const gap = p.potential - ov; // si positif → marge de progression

  // courbe simple : pic vers 26–27, formation avant, déclin après 30
  let delta = 0;
  if (p.age <= 22) delta = 2.0 + gap*0.03;
  else if (p.age <= 26) delta = 1.5 + gap*0.02;
  else if (p.age <= 29) delta = 0.6 + gap*0.01;
  else if (p.age <= 32) delta = -0.8;           // début de déclin
  else if (p.age <= 35) delta = -1.6;
  else delta = -2.5;

  // bruit léger
  delta += (Math.random()-0.5)*0.6;

  // répartir sur quelques attributs
  const apply = (v:number)=>clamp(v + delta*(Math.random()*0.6+0.2));
  p.ratingOff = apply(p.ratingOff);
  p.threePt   = apply(p.threePt);
  p.dribble   = apply(p.dribble);
  p.pass      = apply(p.pass);
  p.ratingDef = apply(p.ratingDef);
  p.ratingReb = apply(p.ratingReb);
  p.stamina   = clamp(p.stamina + (delta>0? +0.3 : -0.5));

  // maj âge + prix
  p.age = Math.min(40, p.age + 1);
  p.price = computeMarketValue(p);
}

export async function tickSeasonAll() {
  const players = await Player.find();
  for (const p of players) {
    seasonProgress(p);
    await p.save();
  }
}
