import { io, Socket } from 'socket.io-client';

export type Match = {
  gameId: string;
  gameType: string;
  players: { id: string; username: string }[];
  timestamp: number;
};

export class GameSocket {
  private socket: Socket;
  public gameId?: string;

  constructor(baseUrl: string, token: string) {
    this.socket = io(baseUrl, { transports: ['websocket'], auth: { token } });
  }

  onConnect(cb: () => void) { this.socket.on('connect', cb); }
  onConnectError(cb: (e:any)=>void) { this.socket.on('connect_error', cb); }

  findMatch(gameType = 'pong') { this.socket.emit('find_match', gameType); }
  onMatchmakingStarted(cb: (d:{gameType:string}) => void) { this.socket.on('matchmaking_started', cb); }
  onMatchFound(cb: (m: Match) => void) { this.socket.on('match_found', (m:Match) => { this.gameId = m.gameId; cb(m); }); }
  onMatchError(cb: (d:{message:string}) => void) { this.socket.on('match_error', cb); }

  sendReady() { if(this.gameId) this.socket.emit('game_ready', this.gameId); }
  sendInput(input:any) { if(this.gameId) this.socket.emit('game_input', { gameId: this.gameId, input }); }

  onPlayerInput(cb:(data:any)=>void){ this.socket.on('player_input', cb); }
  onOpponentReady(cb:(d:{playerId:string})=>void){ this.socket.on('opponent_ready', cb); }

  disconnect(){ this.socket.disconnect(); }
}
