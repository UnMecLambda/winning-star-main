// backend/src/manager/seed.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import { Player } from './models/Player';

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ibet';

type Pos = 'PG'|'SG'|'SF'|'PF'|'C';

function clamp(n:number,min=1,max=99){ return Math.max(min, Math.min(max, Math.round(n))); }
function r(min:number,max:number){ return Math.round(min + Math.random()*(max-min)); }
function jitter(v:number, j=5){ return clamp(v + r(-j,j)); }

function mk(
  name: string, position: Pos,
  base: Partial<{
    ratingOff:number; ratingDef:number; ratingReb:number; price:number;
    speed:number; pass:number; dribble:number; threePt:number; stamina:number;
  }>
){
  const off = base.ratingOff ?? 75, def = base.ratingDef ?? 75, reb = base.ratingReb ?? 60;
  const price = base.price ?? Math.round((off*1.2 + def + reb*0.9)/3) * 5 + r(50,120);
  return {
    name, position,
    ratingOff: clamp(off), ratingDef: clamp(def), ratingReb: clamp(reb),
    price: clamp(price, 120, 600),
    speed:   clamp(base.speed   ?? 70),
    pass:    clamp(base.pass    ?? 70),
    dribble: clamp(base.dribble ?? 70),
    threePt: clamp(base.threePt ?? 70),
    stamina: clamp(base.stamina ?? 75),
  };
}

// Archétypes par poste
function pg(n:string){ return mk(n,'PG',{ ratingOff:r(80,92), ratingDef:r(70,82), ratingReb:r(35,48), speed:r(84,95), pass:r(85,96), dribble:r(84,95), threePt:r(78,92), stamina:r(78,90) }); }
function sg(n:string){ return mk(n,'SG',{ ratingOff:r(82,94), ratingDef:r(68,84), ratingReb:r(40,55), speed:r(80,92), pass:r(72,84), dribble:r(80,92), threePt:r(82,95), stamina:r(76,90) }); }
function sf(n:string){ return mk(n,'SF',{ ratingOff:r(78,90), ratingDef:r(74,88), ratingReb:r(58,74), speed:r(74,86), pass:r(70,82), dribble:r(72,86), threePt:r(74,88), stamina:r(78,92) }); }
function pf(n:string){ return mk(n,'PF',{ ratingOff:r(72,86), ratingDef:r(78,90), ratingReb:r(76,92), speed:r(66,80), pass:r(62,76), dribble:r(60,74), threePt:r(60,78), stamina:r(80,94) }); }
function c (n:string){ return mk(n,'C' ,{ ratingOff:r(68,82), ratingDef:r(80,94), ratingReb:r(84,98), speed:r(58,72), pass:r(60,74), dribble:r(50,66), threePt:r(45,62), stamina:r(82,96) }); }

// Noms rapides (fictifs)
const first = ['Tyrese','Jalen','Miles','Kobe','Evan','Zion','Luka','Trae','Donovan','Jrue','Devin','Jayson','Jaylen','Shai','Jamal','Darius','Scottie','Paolo','Victor','Nikola','Joel','Bam','Karl','Domantas','Kawhi','Paul','LeBron','Anthony','Kyrie','Jimmy','LaMelo','Franz','Cade','Jaren','RJ','DeAaron','Fred','Tyler'];
const last  = ['Apex','Prime','Blaze','Swift','Vortex','Storm','Edge','Nova','Flux','Bolt','Onyx','Maverick','Specter','Falcon','Rocket','Comet','Viper','Quartz','Carbon','Vector','Titan','Nomad','Phantom','Magnet','Atlas','Ridge','Summit','Glide','Pulse','Echo','Raptor','Quartz','Polar','Forge','Halo','Stride','Drift'];

function uniqueNames(count:number){
  const names = new Set<string>();
  while (names.size < count) {
    names.add(`${first[r(0,first.length-1)]} ${last[r(0,last.length-1)]}`);
  }
  return Array.from(names);
}

async function run() {
  await mongoose.connect(MONGO);
  console.log('Mongo connected → seeding players v2…');

  await Player.deleteMany({});
  const names = uniqueNames(40);

  // Répartition par postes
  const players = [
    // 8 PG
    ...names.slice(0,8).map(pg),
    // 8 SG
    ...names.slice(8,16).map(sg),
    // 8 SF
    ...names.slice(16,24).map(sf),
    // 8 PF
    ...names.slice(24,32).map(pf),
    // 8 C
    ...names.slice(32,40).map(c),
  ];

  // Petits ajustements de pricing pour top tiers
  players.sort((a,b)=> (b.ratingOff+b.ratingDef+b.ratingReb) - (a.ratingOff+a.ratingDef+a.ratingReb));
  players.forEach((p,idx)=>{
    if (idx < 5) p.price = clamp(p.price + 120, 300, 700); // stars
    else if (idx < 10) p.price = clamp(p.price + 60, 240, 640);
  });

  await Player.insertMany(players);
  console.log(`Seed v2 OK → ${players.length} players.`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
