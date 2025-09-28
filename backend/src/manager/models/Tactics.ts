export type OffTactic =
  | 'fast_break'       // contre-attaque
  | 'ball_movement'    // faire tourner la balle
  | 'isolation'        // iso
  | 'pick_and_roll'    // PnR
  | 'post_up'          // jeu au poste
  | 'pace_and_space';  // rythme + spacing

export type DefTactic =
  | 'man_to_man'       // indiv
  | 'zone_23'
  | 'zone_32'
  | 'switch_all'
  | 'drop'             // drop coverage
  | 'full_court_press';

export const DEFAULT_OFF: OffTactic = 'pace_and_space';
export const DEFAULT_DEF: DefTactic = 'man_to_man';

export interface Tactics {
  offense: OffTactic;
  defense: DefTactic;
}
