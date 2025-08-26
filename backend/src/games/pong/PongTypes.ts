export type PlayerSide = 'bottom' | 'top';

export type PongInput =
  | { type: 'move'; x: number; y: number }
  | { type: 'serve' };

export interface PongState {
  gameId: string;
  serverSide: PlayerSide;
  serving: boolean;
  ball: { x: number; y: number; vx: number; vy: number };
  players: {
    bottom: { x: number; y: number; score: number; fury: number };
    top:    { x: number; y: number; score: number; fury: number };
  };
  rally: number;
  ts: number;
}
