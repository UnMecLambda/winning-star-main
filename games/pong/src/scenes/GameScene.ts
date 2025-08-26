import Phaser from 'phaser';
import { GameSocket, Match } from '../network/GameSocket';

type PlayerSide = 'bottom' | 'top';
type Handed = 'left' | 'right';

function decodeJwt(token: string): any | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

export class GameScene extends Phaser.Scene {
  private token: string;
  private socket?: GameSocket;
  private myUserId?: string;
  private isTrainingMode = false;

  private court!: Phaser.GameObjects.Rectangle;
  private netLine!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;

  private ball!: Phaser.GameObjects.Arc;
  private me!: Phaser.GameObjects.Arc;
  private opp!: Phaser.GameObjects.Arc;

  private myRacket!: Phaser.GameObjects.Image;
  private oppRacket!: Phaser.GameObjects.Image;

  private myHandedness: Handed = 'right';
  private oppHandedness: Handed = 'right';

  // Training mode variables
  private ballVelocity = { x: 0, y: 0 };
  private paddleSpeed = 300;
  private ballSpeed = 400;

  private scoreTop = 0;
  private scoreBottom = 0;
  private scoreText!: Phaser.GameObjects.Text;

  private furyBar!: Phaser.GameObjects.Rectangle;

  private mySide: PlayerSide = 'bottom';
  private serverSide: PlayerSide = 'bottom';
  private serving = true;

  constructor(token: string){
    super('game');
    this.token = token;
  }

  preload(){
    if (!this.textures.exists('white')) {
      const g = this.add.graphics().fillStyle(0xffffff).fillRect(0,0,2,2);
      g.generateTexture('white', 2, 2);
      g.destroy();
    }
    
    const params = new URLSearchParams(location.search);
    
    // Check if training mode
    this.isTrainingMode = !this.token || params.get('mode') === 'training';
    
    // Always try to load starter racket for training mode
    this.load.image('starter-racket', '/assets/rackets/starter-racket.png');
    
    // Load custom racket images from racket data
    const racketData = params.get('racket');
    if (racketData) {
      try {
        const racket = JSON.parse(decodeURIComponent(racketData));
        if (racket.imagePath) {
          this.load.image('racket_my', racket.imagePath);
        }
      } catch (e) {
        console.warn('Failed to parse racket data:', e);
      }
    }
  }

  create(){
    const w = this.scale.width, h = this.scale.height;

    const margin = 60;
    const courtW = w - margin*2;
    const courtH = h - 260;
    const courtY = 100;

    this.court = this.add.rectangle(w/2, courtY + courtH/2, courtW, courtH, 0x2b8a3e).setStrokeStyle(8, 0xffffff);
    const line = (x:number,y:number,w:number,h:number)=>this.add.rectangle(x,y,w,h,0xffffff).setOrigin(0.5).setDepth(0);
    line(this.court.x, this.court.y, courtW-40, 4);
    line(this.court.x, this.court.y + courtH/2, courtW-40, 4);
    line(this.court.x, this.court.y - courtH/2, courtW-40, 4);
    line(this.court.x, this.court.y, 4, courtH-40);

    if (this.textures.exists('net_img')) {
      this.netLine = this.add.image(w/2, courtY + courtH/2, 'net_img').setDisplaySize(courtW, 14).setDepth(2);
    } else {
      this.netLine = this.add.rectangle(w/2, courtY + courtH/2, courtW, 8, 0xffffff).setDepth(2);
      this.add.rectangle(w/2+2, courtY + courtH/2+2, courtW, 2, 0x000000).setAlpha(.25).setDepth(1.9);
    }

    // simple cercles pour corps/ball
    this.me  = this.add.circle(w/2, courtY + courtH - 40, 20, 0x111111);
    this.opp = this.add.circle(w/2, courtY + 40,         20, 0x222244);
    this.ball = this.add.circle(w/2, h/2, 10, 0xffde59);

    // Raquettes PNG
    this.myRacket  = this.createRacketSprite(true,  this.myHandedness);
    this.oppRacket = this.createRacketSprite(false, this.oppHandedness);

    // HUD
    this.scoreText = this.add.text(w/2, 24, '0 : 0', { fontFamily: 'Arial', fontSize: '28px', color: '#fff' }).setOrigin(0.5,0);
    this.furyBar = this.add.rectangle(20, h/2, 14, 0, 0xffcc00).setOrigin(0.5,1);

    // Sockets
    this.myUserId = decodeJwt(this.token || '')?.userId || undefined;
    const backendUrl = (window as any).IBET_BACKEND_URL || (new URLSearchParams(location.search).get('api') || 'http://localhost:4000');
    
    if(this.token && !this.isTrainingMode){
      import('../network/GameSocket').then(() => {
        this.socket = new GameSocket(backendUrl, this.token);
        this.bindSocket();
      });
    } else {
      if (this.isTrainingMode) {
        this.showToast('Training Mode');
        this.startTrainingMode();
      } else {
        this.showToast('Login required for multiplayer');
      }
    }

    // Input → envoie seulement les mouvements
    this.input.on('pointermove', (p: Phaser.Input.Pointer)=>{
      if (this.isTrainingMode) {
        this.handleTrainingInput(p);
      } else {
        this.sendInput({ type:'move', x:p.x, y:p.y });
      }
    });
    
    this.input.on('pointerdown', ()=>{
      if (this.isTrainingMode) {
        this.serveTrainingBall();
      } else if (this.serving && this.mySide === this.serverSide){
        this.sendInput({ type:'serve' });
      }
    });

    // Bouton Menu
    const menuBtn = this.add.rectangle(w - 60, 30, 100, 40, 0x333333)
      .setStrokeStyle(2, 0x666666)
      .setInteractive()
      .on('pointerdown', () => { window.location.href = window.location.origin + '/play'; })
      .on('pointerover', () => menuBtn.setFillStyle(0x555555))
      .on('pointerout',  () => menuBtn.setFillStyle(0x333333));
    this.add.text(w - 60, 30, 'Menu', { fontFamily: 'Arial', fontSize: '16px', color: '#fff' }).setOrigin(0.5);
  }

  private startTrainingMode() {
    // Initialize training mode
    this.mySide = 'bottom';
    this.serving = true;
    this.serverSide = 'bottom';
    
    // Position players
    const w = this.scale.width, h = this.scale.height;
    const courtH = h - 260;
    const courtY = 100;
    
    this.me.setPosition(w/2, courtY + courtH - 40);
    this.opp.setPosition(w/2, courtY + 40);
    
    // Position ball for serve
    this.ball.setPosition(w/2, courtY + courtH - 80);
    
    // Update racket positions
    this.updateRacketPositions();
    
    // Start training loop
    this.time.addEvent({
      delay: 16, // ~60 FPS
      callback: this.updateTraining,
      callbackScope: this,
      loop: true
    });
  }

  private handleTrainingInput(pointer: Phaser.Input.Pointer) {
    const w = this.scale.width, h = this.scale.height;
    const courtH = h - 260;
    const courtY = 100;
    
    // Clamp to bottom half of court
    const minY = courtY + courtH/2;
    const maxY = courtY + courtH - 40;
    const clampedY = Phaser.Math.Clamp(pointer.y, minY, maxY);
    
    this.me.setPosition(pointer.x, clampedY);
    this.updateRacketPositions();
  }

  private serveTrainingBall() {
    if (!this.serving) return;
    
    this.serving = false;
    const angle = Phaser.Math.Between(-45, -20);
    const rad = Phaser.Math.DegToRad(angle);
    
    this.ballVelocity.x = Math.sin(rad) * this.ballSpeed;
    this.ballVelocity.y = Math.cos(rad) * this.ballSpeed * -1;
  }

  private updateTraining() {
    if (this.serving) return;
    
    const w = this.scale.width, h = this.scale.height;
    const courtH = h - 260;
    const courtY = 100;
    const margin = 60;
    const courtW = w - margin * 2;
    
    // Move ball
    this.ball.x += this.ballVelocity.x * 0.016;
    this.ball.y += this.ballVelocity.y * 0.016;
    
    // Bounce off sides
    const leftBound = w/2 - courtW/2 + 10;
    const rightBound = w/2 + courtW/2 - 10;
    
    if (this.ball.x <= leftBound || this.ball.x >= rightBound) {
      this.ballVelocity.x *= -1;
      this.ball.x = Phaser.Math.Clamp(this.ball.x, leftBound, rightBound);
    }
    
    // Check for scoring (ball goes out top or bottom)
    if (this.ball.y < courtY - 10) {
      this.scoreBottom++;
      this.resetTrainingBall();
    } else if (this.ball.y > courtY + courtH + 10) {
      this.scoreTop++;
      this.resetTrainingBall();
    }
    
    // Simple AI for opponent
    const oppTarget = this.ball.x;
    const oppSpeed = 200;
    if (this.opp.x < oppTarget - 5) {
      this.opp.x += oppSpeed * 0.016;
    } else if (this.opp.x > oppTarget + 5) {
      this.opp.x -= oppSpeed * 0.016;
    }
    
    // Check collisions
    this.checkTrainingCollisions();
    
    // Update score
    this.scoreText.setText(`${this.scoreTop} : ${this.scoreBottom}`);
    
    // Update racket positions
    this.updateRacketPositions();
  }

  private checkTrainingCollisions() {
    const ballRadius = 10;
    const paddleWidth = 60;
    const paddleHeight = 20;
    
    // Check collision with player (bottom)
    if (this.ballVelocity.y > 0 && 
        Math.abs(this.ball.x - this.me.x) < paddleWidth/2 &&
        Math.abs(this.ball.y - this.me.y) < paddleHeight + ballRadius) {
      
      const hitPos = (this.ball.x - this.me.x) / (paddleWidth/2);
      const angle = hitPos * 45; // Max 45 degree angle
      const rad = Phaser.Math.DegToRad(angle);
      
      this.ballVelocity.x = Math.sin(rad) * this.ballSpeed;
      this.ballVelocity.y = Math.cos(rad) * this.ballSpeed * -1;
      
      this.ball.y = this.me.y - paddleHeight - ballRadius;
    }
    
    // Check collision with opponent (top)
    if (this.ballVelocity.y < 0 && 
        Math.abs(this.ball.x - this.opp.x) < paddleWidth/2 &&
        Math.abs(this.ball.y - this.opp.y) < paddleHeight + ballRadius) {
      
      const hitPos = (this.ball.x - this.opp.x) / (paddleWidth/2);
      const angle = hitPos * 45;
      const rad = Phaser.Math.DegToRad(angle);
      
      this.ballVelocity.x = Math.sin(rad) * this.ballSpeed;
      this.ballVelocity.y = Math.cos(rad) * this.ballSpeed;
      
      this.ball.y = this.opp.y + paddleHeight + ballRadius;
    }
  }

  private resetTrainingBall() {
    this.serving = true;
    const w = this.scale.width, h = this.scale.height;
    const courtH = h - 260;
    const courtY = 100;
    
    this.ball.setPosition(w/2, courtY + courtH - 80);
    this.ballVelocity.x = 0;
    this.ballVelocity.y = 0;
  }

  private bindSocket(){
    if(!this.socket) return;
    this.socket.onConnect(()=> console.log('[socket] connected'));
    this.socket.onConnectError((e)=> console.warn('[socket] error', e));

    this.socket.onMatchmakingStarted(()=> this.showToast('Matchmaking...'));
    this.socket.onMatchFound((m: Match)=>{
      this.assignSides(m);
      this.showToast('Match found');
      this.socket?.sendReady(); // déclenche la room serveur
    });

    // Nouvel état serveur
    (this.socket as any)['socket'].on('pong_state', (state:any)=> this.applyState(state));
  }

  private assignSides(match: Match){
    const ids = match.players.map(p=>p.id).sort();
    const bottomId = ids[0];
    this.mySide = (this.myUserId === bottomId) ? 'bottom' : 'top';
  }

  private applyState(s: any){
    // positions
    this.me.setPosition(s.players[this.mySide].x, s.players[this.mySide].y);
    const oppSide: PlayerSide = this.mySide === 'bottom' ? 'top' : 'bottom';
    this.opp.setPosition(s.players[oppSide].x, s.players[oppSide].y);

    this.ball.setPosition(s.ball.x, s.ball.y);

    // fury (barre)
    const fury = s.players[this.mySide].fury as number;
    const h = Phaser.Math.Linear(0, 300, Phaser.Math.Clamp(fury,0,100)/100);
    this.furyBar.setSize(14, h);
    this.furyBar.setY(this.scale.height/2 + h/2);

    // score
    this.scoreTop    = s.players.top.score;
    this.scoreBottom = s.players.bottom.score;
    this.scoreText.setText(`${this.scoreTop} : ${this.scoreBottom}`);

    this.serverSide = s.serverSide;
    this.serving    = s.serving;

    // place raquettes
    this.positionRacket(this.myRacket,  this.me.x,  this.me.y,  this.mySide, this.myHandedness);
    this.positionRacket(this.oppRacket, this.opp.x, this.opp.y, oppSide,     this.oppHandedness);
  }

  private sendInput(input: any){ this.socket?.sendInput(input); }

  private createRacketSprite(isMine: boolean, handed: Handed): Phaser.GameObjects.Image {
    // Try to use PNG image first
    let key = '';
    
    if (isMine && this.textures.exists('racket_my')) {
      key = 'racket_my';
    } else if (this.textures.exists('starter-racket')) {
      // Fallback to starter racket for training mode
      key = 'starter-racket';
    }

    if (key) {
      const img = this.add.image(0, 0, key);
      img.setOrigin(0.5, 0.8); // Center horizontally, bottom of racket at player
      img.setScale(0.4);
      img.setAngle(handed === 'right' ? -15 : 15);
      img.setDepth(3);
      return img;
    }
    
    // Fallback: create visual racket if no PNG
    return this.createVisualRacket(handed);
  }

  private updateRacketPositions() {
    this.positionRacket(this.myRacket, this.me.x, this.me.y, this.mySide, this.myHandedness);
    const oppSide: PlayerSide = this.mySide === 'bottom' ? 'top' : 'bottom';
    this.positionRacket(this.oppRacket, this.opp.x, this.opp.y, oppSide, this.oppHandedness);
  }

  private positionRacket(r: Phaser.GameObjects.Image | Phaser.GameObjects.Container, px: number, py: number, side: PlayerSide, handed: Handed) {
    const yOffset = side === 'bottom' ? -50 : +50;
    const xOffset = handed === 'right' ? +15 : -15;
    r.setPosition(px + xOffset, py + yOffset);
  }

  private createVisualRacket(handed: Handed): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    
    // Racket head (oval)
    const head = this.add.ellipse(0, -20, 40, 60, 0x8B4513);
    head.setStrokeStyle(3, 0x654321);
    
    // Handle
    const handle = this.add.rectangle(0, 15, 8, 50, 0x654321);
    
    // Strings (vertical)
    for (let i = -15; i <= 15; i += 5) {
      const string = this.add.line(0, -20, i, -45, i, 5, 0xFFFFFF);
      string.setLineWidth(1);
      container.add(string);
    }
    
    // Strings (horizontal)
    for (let i = -40; i <= 0; i += 8) {
      const string = this.add.line(0, -20, -18, i, 18, i, 0xFFFFFF);
      string.setLineWidth(1);
      container.add(string);
    }
    
    // Grip tape
    const grip = this.add.rectangle(0, 25, 10, 20, 0x333333);
    
    container.add([head, handle, grip]);
    container.setScale(0.8);
    container.setAngle(handed === 'right' ? -15 : 15);
    container.setDepth(3);
    
    return container;
  }
  
  private toast?: Phaser.GameObjects.Text;
  private showToast(msg:string){
    if(this.toast) this.toast.destroy();
    this.toast = this.add.text(this.scale.width/2, 60, msg, { fontFamily:'Arial', fontSize:'20px', color:'#fff', backgroundColor:'#0008', padding:{x:10,y:6}}).setOrigin(0.5);
    this.tweens.add({ targets:this.toast, alpha:0, duration:1600, delay:800, onComplete: ()=> this.toast?.destroy() });
  }
}
