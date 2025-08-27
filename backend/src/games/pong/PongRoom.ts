import { Server, Socket } from 'socket.io';
import { PongInput, PongState, PlayerSide } from './PongTypes';

type Player = {
  id: string;
  socket: Socket;
  side: PlayerSide;
  x: number;
  y: number;
  score: number;
  fury: number;
  ready: boolean;
};

export class PongRoom {
  readonly gameId: string;
  private io: Server;
  private players: Record<PlayerSide, Player>;
  private interval?: NodeJS.Timeout;

  // espace “virtuel” identique au client (720x1280, court centré)
  private width = 720;
  private height = 1280;
  private margin = 60;
  private courtW = this.width - this.margin * 2;
  private courtH = this.height - 260;
  private courtY = 100;

  private BOUNDS = {
    left:  0,
    right: 0,
    top:   0,
    bottom:0
  };

  private ball = { x: this.width/2, y: this.height/2, vx: 0, vy: 0, r: 10 };
  private rally = 0;
  private serverSide: PlayerSide = 'bottom';
  private serving = true;

  constructor(io: Server, gameId: string, pBottom: Socket, pTop: Socket) {
    this.io = io;
    this.gameId = gameId;

    // bornes du court
    this.BOUNDS.left   = this.width/2 - this.courtW/2 + 10;
    this.BOUNDS.right  = this.width/2 + this.courtW/2 - 10;
    this.BOUNDS.top    = (this.courtY + this.courtH/2) - this.courtH + 10;
    this.BOUNDS.bottom = (this.courtY + this.courtH/2) - 10;

    this.players = {
      bottom: {
        id: pBottom.id, socket: pBottom, side: 'bottom',
        x: this.width/2, y: this.BOUNDS.bottom - 40, score: 0, fury: 0, ready: false
      },
      top: {
        id: pTop.id, socket: pTop, side: 'top',
        x: this.width/2, y: this.BOUNDS.top + 40, score: 0, fury: 0, ready: false
      }
    };

    pBottom.join(this.gameId);
    pTop.join(this.gameId);

    const onInput = (payload: { gameId: string; input: PongInput }) => {
      if (payload?.gameId !== this.gameId) return;
      const who = (pBottom.id === (pBottom as any).id) ? 'bottom' : 'bottom'; // placeholder TS
    };

    pBottom.on('game_input', (d:any)=> this.handleInput(pBottom, d?.input));
    pTop.on('game_input',    (d:any)=> this.handleInput(pTop, d?.input));

    pBottom.on('game_ready', ()=> { this.players.bottom.ready = true; this.tryStart(); });
    pTop.on('game_ready',    ()=> { this.players.top.ready = true; this.tryStart(); });

    pBottom.on('disconnect', ()=> this.end('bottom'));
    pTop.on('disconnect',    ()=> this.end('top'));

    // état initial (balle chez le serveur)
    this.resetForServe();
    this.broadcastState();
    
    console.log(`PongRoom created: ${gameId}`);
  }

  private tryStart(){
    if (this.players.bottom.ready && this.players.top.ready && !this.interval){
      console.log('Starting pong game:', this.gameId);
      
      // Start game loop immediately
      this.interval = setInterval(()=> this.tick(), 1000/60);     // logique 60 fps
      
      // Send game started event first
      this.io.to(this.gameId).emit('game_started');
      
      // Then broadcast initial state
      this.broadcastState();
      
      // Continue broadcasting at 20 Hz
      setInterval(()=> this.broadcastState(), 50);
    }
  }

  private tick(){
    if (this.serving) return; // en attente de service

    // Mouvement
    this.ball.x += this.ball.vx * (1/60);
    this.ball.y += this.ball.vy * (1/60);

    // Rebond côtés
    if (this.ball.x < this.BOUNDS.left + this.ball.r) {
      this.ball.x = this.BOUNDS.left + this.ball.r;
      this.ball.vx = Math.abs(this.ball.vx);
    } else if (this.ball.x > this.BOUNDS.right - this.ball.r) {
      this.ball.x = this.BOUNDS.right - this.ball.r;
      this.ball.vx = -Math.abs(this.ball.vx);
    }

    // Sortie haut/bas => point
    if (this.ball.y < this.BOUNDS.top - 4) {
      this.point('bottom');
      return;
    }
    if (this.ball.y > this.BOUNDS.bottom + 4) {
      this.point('top');
      return;
    }

    // Collisions “paddle” (zone près du joueur)
    this.tryHit('bottom');
    this.tryHit('top');
  }

  private tryHit(side: PlayerSide){
    const p = this.players[side];
    const towards = side === 'bottom' ? 1 : -1; // balle doit se déplacer vers le joueur
    if (towards === 1 && this.ball.vy <= 0) return;
    if (towards === -1 && this.ball.vy >= 0) return;

    const hitY = (side === 'bottom') ? (p.y - 28) : (p.y + 28);
    if (Math.abs(this.ball.y - hitY) > 18) return;
    const hitHalf = 28;
    const dx = this.ball.x - p.x;
    if (Math.abs(dx) > hitHalf) return;

    // on a un hit
    this.rally++;
    p.fury = Math.min(100, p.fury + 8);

    const baseSpeed = 380;
    const rallyBonus = Math.min(220, this.rally * 8);
    const furyBonus = p.fury * 1.5;
    const speed = baseSpeed + rallyBonus + furyBonus;

    const maxAngle = 60;
    const angle = (dx / hitHalf) * maxAngle;
    const rad = (angle * Math.PI) / 180;

    const vx = Math.sin(rad) * speed;
    const vy = (side === 'bottom' ? -1 : 1) * Math.cos(rad) * speed;

    this.ball.vx = vx;
    this.ball.vy = vy;

    // éloigne légèrement la balle pour éviter double hit
    this.ball.y += (side === 'bottom' ? -1 : 1) * 6;
  }

  private point(winner: PlayerSide){
    this.players[winner].score += 1;
    // alternance service
    this.serverSide = (this.serverSide === 'bottom') ? 'top' : 'bottom';
    this.players.bottom.fury = Math.max(0, this.players.bottom.fury - 25);
    this.players.top.fury    = Math.max(0, this.players.top.fury - 25);
    this.rally = 0;
    this.resetForServe();
    this.broadcastState();
  }

  private resetForServe(){
    this.serving = true;
    if (this.serverSide === 'bottom'){
      this.ball.x = this.width/2;
      this.ball.y = this.BOUNDS.bottom - 80;
    } else {
      this.ball.x = this.width/2;
      this.ball.y = this.BOUNDS.top + 80;
    }
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  handleInput(sender: Socket, input?: PongInput){
    if (!input) return;
    const side = sender.id === this.players.bottom.id ? 'bottom' : 'top';
    const p = this.players[side];
    
    console.log(`Input from ${side}:`, input.type, input.type === 'move' ? `x:${input.x} y:${input.y}` : '');

    if (input.type === 'move'){
      // clamp aux bornes de sa moitié
      const x = Math.max(this.BOUNDS.left+40, Math.min(this.BOUNDS.right-40, input.x));
      const minY = side === 'bottom' ? this.courtY + this.courtH/2 : this.BOUNDS.top;
      const maxY = side === 'bottom' ? this.BOUNDS.bottom : this.courtY + this.courtH/2;
      const y = Math.max(minY, Math.min(maxY, input.y));
      p.x = x; p.y = y;
    }

    if (input.type === 'serve' && this.serving && side === this.serverSide){
      // service depuis le serveur courant
      console.log(`${side} is serving!`);
      this.serving = false;
      const base = 420;
      const angle = (side==='bottom')
        ? this.randBetween(-50, -20)
        : this.randBetween(20, 50);
      const rad = (angle * Math.PI) / 180;
      const speed = base * (1 + p.fury * 0.002);
      this.ball.vx = Math.sin(rad) * speed;
      this.ball.vy = (side === 'bottom' ? -1 : 1) * Math.cos(rad) * speed;
    }
  }

  private randBetween(a:number,b:number){ return a + Math.random()*(b-a); }

  private broadcastState(){
    const state: PongState = {
      gameId: this.gameId,
      serverSide: this.serverSide,
      serving: this.serving,
      ball: { x: this.ball.x, y: this.ball.y, vx: this.ball.vx, vy: this.ball.vy },
      players: {
        bottom: { x: this.players.bottom.x, y: this.players.bottom.y, score: this.players.bottom.score, fury: this.players.bottom.fury },
        top:    { x: this.players.top.x,    y: this.players.top.y,    score: this.players.top.score,    fury: this.players.top.fury }
      },
      rally: this.rally,
      ts: Date.now()
    };
    console.log('Broadcasting state:', state.gameId, 'serving:', state.serving, 'serverSide:', state.serverSide);
    this.io.to(this.gameId).emit('pong_state', state);
  }

  end(reason: PlayerSide){
    clearInterval(this.interval as NodeJS.Timeout);
    this.io.to(this.gameId).emit('game_ended', { reason });
    this.io.in(this.gameId).socketsLeave(this.gameId);
  }
}
