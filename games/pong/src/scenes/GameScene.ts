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

  private myRacket!: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
  private oppRacket!: Phaser.GameObjects.Image | Phaser.GameObjects.Container;

  private myHandedness: Handed = 'right';
  private oppHandedness: Handed = 'right';

  // Training mode variables
  private ballVelocity = { x: 0, y: 0 };
  private paddleSpeed = 300;
  private ballSpeed = 400;
  private trainingLoop?: Phaser.Time.TimerEvent;

  private scoreTop = 0;
  private scoreBottom = 0;
  private scoreText!: Phaser.GameObjects.Text;

  private furyBar!: Phaser.GameObjects.Rectangle;

  private mySide: PlayerSide = 'bottom';
  private serverSide: PlayerSide = 'bottom';
  private serving = true;

  // Court bounds
  private courtBounds = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };

  constructor(token: string){
    super('game');
    this.token = token;
  }

  preload(){
    // Create white texture if not exists
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

    // Set court bounds
    this.courtBounds = {
      left: w/2 - courtW/2 + 10,
      right: w/2 + courtW/2 - 10,
      top: courtY + 10,
      bottom: courtY + courtH - 10
    };

    // Create court
    this.court = this.add.rectangle(w/2, courtY + courtH/2, courtW, courtH, 0x2b8a3e).setStrokeStyle(8, 0xffffff);
    
    // Court lines
    const line = (x:number,y:number,w:number,h:number)=>this.add.rectangle(x,y,w,h,0xffffff).setOrigin(0.5).setDepth(0);
    line(this.court.x, this.court.y, courtW-40, 4);
    line(this.court.x, this.court.y + courtH/2, courtW-40, 4);
    line(this.court.x, this.court.y - courtH/2, courtW-40, 4);
    line(this.court.x, this.court.y, 4, courtH-40);

    // Net
    if (this.textures.exists('net_img')) {
      this.netLine = this.add.image(w/2, courtY + courtH/2, 'net_img').setDisplaySize(courtW, 14).setDepth(2);
    } else {
      this.netLine = this.add.rectangle(w/2, courtY + courtH/2, courtW, 8, 0xffffff).setDepth(2);
      this.add.rectangle(w/2+2, courtY + courtH/2+2, courtW, 2, 0x000000).setAlpha(.25).setDepth(1.9);
    }

    // Players (circles)
    this.me  = this.add.circle(w/2, this.courtBounds.bottom - 40, 20, 0x111111);
    this.opp = this.add.circle(w/2, this.courtBounds.top + 40, 20, 0x222244);
    
    // Ball
    this.ball = this.add.circle(w/2, this.courtBounds.bottom - 80, 10, 0xffde59);

    // Create rackets
    this.myRacket  = this.createRacketSprite(true,  this.myHandedness);
    this.oppRacket = this.createRacketSprite(false, this.oppHandedness);

    // Position rackets initially
    this.updateRacketPositions();

    // HUD
    this.scoreText = this.add.text(w/2, 24, '0 : 0', { 
      fontFamily: 'Arial', 
      fontSize: '28px', 
      color: '#fff' 
    }).setOrigin(0.5,0);
    
    this.furyBar = this.add.rectangle(20, h/2, 14, 0, 0xffcc00).setOrigin(0.5,1);

    // Setup input handlers
    this.setupInputHandlers();

    // Setup game mode
    if (this.isTrainingMode) {
      // Start training mode immediately
      this.time.delayedCall(100, () => {
      this.startTrainingMode();
      });
    } else {
      this.setupMultiplayerMode();
    }

    // Menu button
    this.createMenuButton();
  }

  private setupInputHandlers() {
    // Mouse/touch movement
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isTrainingMode) {
        this.handleTrainingInput(pointer);
      } else {
        this.sendInput({ type:'move', x:pointer.x, y:pointer.y });
      }
    });
    
    // Click/tap to serve
    this.input.on('pointerdown', () => {
      if (this.isTrainingMode) {
        this.serveTrainingBall();
      } else if (this.serving && this.mySide === this.serverSide) {
        this.sendInput({ type:'serve' });
      }
    });
  }

  private startTrainingMode() {
    console.log('Starting training mode');
    this.showToast('Training Mode - Click to serve!');
    
    // Initialize training state
    this.mySide = 'bottom';
    this.serving = true;
    this.serverSide = 'bottom';
    this.scoreTop = 0;
    this.scoreBottom = 0;
    
    // Position ball for serve
    this.resetTrainingBall();
    
    // Start training loop
    this.trainingLoop = this.time.addEvent({
      delay: 16, // ~60 FPS
      callback: this.updateTraining,
      callbackScope: this,
      loop: true
    });
  }

  private setupMultiplayerMode() {
    this.myUserId = decodeJwt(this.token || '')?.userId || undefined;
    const backendUrl = (window as any).IBET_BACKEND_URL || 
                      (new URLSearchParams(location.search).get('api') || 'http://localhost:4000');
    
    if (this.token) {
      import('../network/GameSocket').then(() => {
        this.socket = new GameSocket(backendUrl, this.token);
        this.bindSocket();
      });
    } else {
      this.showToast('Login required for multiplayer');
    }
  }

  private handleTrainingInput(pointer: Phaser.Input.Pointer) {
    // Clamp to bottom half of court
    const minY = this.courtBounds.top + (this.courtBounds.bottom - this.courtBounds.top) / 2;
    const maxY = this.courtBounds.bottom - 40;
    const clampedX = Phaser.Math.Clamp(pointer.x, this.courtBounds.left + 40, this.courtBounds.right - 40);
    const clampedY = Phaser.Math.Clamp(pointer.y, minY, maxY);
    
    this.me.setPosition(clampedX, clampedY);
    this.updateRacketPositions();
  }

  private serveTrainingBall() {
    if (!this.serving) return;
    
    console.log('Serving ball in training mode');
    this.serving = false;
    
    // Random serve angle
    const angle = Phaser.Math.Between(-45, -20);
    const rad = Phaser.Math.DegToRad(angle);
    
    this.ballVelocity.x = Math.sin(rad) * this.ballSpeed;
    this.ballVelocity.y = Math.cos(rad) * this.ballSpeed * -1;
  }

  private updateTraining() {
    if (this.serving) return;
    
    const deltaTime = 0.016; // 60 FPS
    
    // Move ball
    this.ball.x += this.ballVelocity.x * deltaTime;
    this.ball.y += this.ballVelocity.y * deltaTime;
    
    // Bounce off sides
    if (this.ball.x <= this.courtBounds.left || this.ball.x >= this.courtBounds.right) {
      this.ballVelocity.x *= -1;
      this.ball.x = Phaser.Math.Clamp(this.ball.x, this.courtBounds.left, this.courtBounds.right);
    }
    
    // Check for scoring (ball goes out top or bottom)
    if (this.ball.y < this.courtBounds.top - 20) {
      this.scoreBottom++;
      this.resetTrainingBall();
      this.showToast('Point! Click to serve');
    } else if (this.ball.y > this.courtBounds.bottom + 20) {
      this.scoreTop++;
      this.resetTrainingBall();
      this.showToast('Opponent scores! Click to serve');
    }
    
    // Simple AI for opponent
    const oppTarget = this.ball.x;
    const oppSpeed = 200 * deltaTime;
    if (this.opp.x < oppTarget - 5) {
      this.opp.x = Math.min(this.opp.x + oppSpeed, this.courtBounds.right - 40);
    } else if (this.opp.x > oppTarget + 5) {
      this.opp.x = Math.max(this.opp.x - oppSpeed, this.courtBounds.left + 40);
    }
    
    // Keep opponent in bounds
    const oppMinY = this.courtBounds.top + 40;
    const oppMaxY = this.courtBounds.top + (this.courtBounds.bottom - this.courtBounds.top) / 2 - 40;
    this.opp.y = Phaser.Math.Clamp(this.opp.y, oppMinY, oppMaxY);
    
    // Check collisions
    this.checkTrainingCollisions();
    
    // Update score display
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
    
    // Reset player position to center bottom
    const centerX = this.scale.width / 2;
    const playerY = this.courtBounds.bottom - 40;
    this.me.setPosition(centerX, playerY);
    
    // Position ball for serve
    this.ball.setPosition(centerX, playerY - 40);
    this.ballVelocity.x = 0;
    this.ballVelocity.y = 0;
    
    // Update racket position
    this.updateRacketPositions();
  }

  private createRacketSprite(isMine: boolean, handed: Handed): Phaser.GameObjects.Image | Phaser.GameObjects.Container {
    // Try to use PNG image first
    let key = '';
    
    if (isMine && this.textures.exists('racket_my')) {
      key = 'racket_my';
    } else if (this.textures.exists('starter-racket')) {
      key = 'starter-racket';
    }

    if (key) {
      const img = this.add.image(0, 0, key);
      img.setOrigin(0.5, 0.8); // Center horizontally, bottom of racket at player
      img.setScale(0.25); // Reduced size
      img.setAngle(handed === 'right' ? -15 : 15);
      img.setDepth(3);
      return img;
    }
    
    // Fallback: create visual racket if no PNG
    return this.createVisualRacket(handed);
  }

  private createVisualRacket(handed: Handed): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    
    // Racket head (oval)
    const head = this.add.ellipse(0, -20, 35, 55, 0x8B4513);
    head.setStrokeStyle(4, 0x654321);
    
    // Handle
    const handle = this.add.rectangle(0, 15, 8, 40, 0x654321);
    
    // Strings (vertical)
    for (let i = -15; i <= 15; i += 5) {
      const string = this.add.line(0, -20, i, -40, i, 0, 0xFFFFFF);
      string.setLineWidth(1.5);
      container.add(string);
    }
    
    // Strings (horizontal)
    for (let i = -35; i <= -5; i += 8) {
      const string = this.add.line(0, -20, -15, i, 15, i, 0xFFFFFF);
      string.setLineWidth(1.5);
      container.add(string);
    }
    
    // Grip tape
    const grip = this.add.rectangle(0, 25, 10, 20, 0x333333);
    
    // Grip lines
    for (let i = 0; i < 4; i++) {
      const gripLine = this.add.rectangle(0, 18 + i * 4, 12, 1, 0x555555);
      container.add(gripLine);
    }
    
    container.add([head, handle, grip]);
    container.setScale(0.4); // Reduced scale
    container.setAngle(handed === 'right' ? -15 : 15);
    container.setDepth(3);
    
    return container;
  }

  private updateRacketPositions() {
    if (this.myRacket) {
      this.positionRacket(this.myRacket, this.me.x, this.me.y, this.mySide, this.myHandedness);
    }
    if (this.oppRacket) {
      const oppSide: PlayerSide = this.mySide === 'bottom' ? 'top' : 'bottom';
      this.positionRacket(this.oppRacket, this.opp.x, this.opp.y, oppSide, this.oppHandedness);
    }
  }

  private positionRacket(
    racket: Phaser.GameObjects.Image | Phaser.GameObjects.Container, 
    px: number, 
    py: number, 
    side: PlayerSide, 
    handed: Handed
  ) {
    const yOffset = side === 'bottom' ? -60 : +60;
    const xOffset = handed === 'right' ? +20 : -20;
    racket.setPosition(px + xOffset, py + yOffset);
  }

  private createMenuButton() {
    const w = this.scale.width;
    const menuBtn = this.add.rectangle(w - 60, 30, 100, 40, 0x333333)
      .setStrokeStyle(2, 0x666666)
      .setInteractive()
      .on('pointerdown', () => { 
        window.location.href = window.location.origin + '/play'; 
      })
      .on('pointerover', () => menuBtn.setFillStyle(0x555555))
      .on('pointerout',  () => menuBtn.setFillStyle(0x333333));
    
    this.add.text(w - 60, 30, 'Menu', { 
      fontFamily: 'Arial', 
      fontSize: '16px', 
      color: '#fff' 
    }).setOrigin(0.5);
  }

  // Multiplayer socket methods
  private bindSocket(){
    if(!this.socket) return;
    this.socket.onConnect(()=> console.log('[socket] connected'));
    this.socket.onConnectError((e)=> console.warn('[socket] error', e));

    this.socket.onMatchmakingStarted(()=> this.showToast('Matchmaking...'));
    this.socket.onMatchFound((m: Match)=>{
      this.assignSides(m);
      this.showToast('Match found');
      this.socket?.sendReady();
    });

    // Server state updates
    (this.socket as any)['socket'].on('pong_state', (state:any)=> this.applyState(state));
  }

  private assignSides(match: Match){
    const ids = match.players.map(p=>p.id).sort();
    const bottomId = ids[0];
    this.mySide = (this.myUserId === bottomId) ? 'bottom' : 'top';
  }

  private applyState(s: any){
    // Update positions
    this.me.setPosition(s.players[this.mySide].x, s.players[this.mySide].y);
    const oppSide: PlayerSide = this.mySide === 'bottom' ? 'top' : 'bottom';
    this.opp.setPosition(s.players[oppSide].x, s.players[oppSide].y);

    this.ball.setPosition(s.ball.x, s.ball.y);

    // Update fury bar
    const fury = s.players[this.mySide].fury as number;
    const h = Phaser.Math.Linear(0, 300, Phaser.Math.Clamp(fury,0,100)/100);
    this.furyBar.setSize(14, h);
    this.furyBar.setY(this.scale.height/2 + h/2);

    // Update score
    this.scoreTop    = s.players.top.score;
    this.scoreBottom = s.players.bottom.score;
    this.scoreText.setText(`${this.scoreTop} : ${this.scoreBottom}`);

    this.serverSide = s.serverSide;
    this.serving    = s.serving;

    // Update racket positions
    this.updateRacketPositions();
  }

  private sendInput(input: any){ 
    this.socket?.sendInput(input); 
  }

  private toast?: Phaser.GameObjects.Text;
  private showToast(msg:string){
    if(this.toast) this.toast.destroy();
    this.toast = this.add.text(this.scale.width/2, 60, msg, { 
      fontFamily:'Arial', 
      fontSize:'20px', 
      color:'#fff', 
      backgroundColor:'#0008', 
      padding:{x:10,y:6}
    }).setOrigin(0.5);
    
    this.tweens.add({ 
      targets:this.toast, 
      alpha:0, 
      duration:1600, 
      delay:800, 
      onComplete: ()=> this.toast?.destroy() 
    });
  }

  destroy() {
    if (this.trainingLoop) {
      this.trainingLoop.destroy();
    }
    super.destroy();
  }
}