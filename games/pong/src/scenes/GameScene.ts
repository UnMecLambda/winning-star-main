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

    const params = new URLSearchParams(window.location.search);

    // Mode
    const practiceParam = params.get('practice');
    const isPracticeMode = practiceParam === 'true';
    const hasValidToken = this.token && this.token.length > 50;
    this.isTrainingMode = isPracticeMode || !hasValidToken;

    // Load racket assets
    this.load.image('starter-racket', '/assets/rackets/starter-racket.png');

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

    // Load character assets
    this.load.image('amara', '/assets/players/amara.png');
    this.load.image('south-park', '/assets/players/south-park.png');

    // Load equipped character from URL params
    const characterData = params.get('character');
    if (characterData) {
      try {
        const character = JSON.parse(decodeURIComponent(characterData));
        if (character.id) {
          this.load.image('character_my', `/assets/players/${character.id}.png`);
        }
      } catch (e) {
        console.warn('Failed to parse character data:', e);
      }
    }
  }

  create(){
    const w = this.scale.width, h = this.scale.height;

    const margin = 60;
    const courtW = w - margin*2;
    const courtH = h - 260;
    const courtY = 100;

    // Set court bounds (identiques au serveur)
    this.courtBounds = {
      left: w/2 - courtW/2 + 10,
      right: w/2 + courtW/2 - 10,
      top: courtY + 10,
      bottom: courtY + courtH - 10
    };

    // Create court
    this.court = this.add.rectangle(w/2, courtY + courtH/2, courtW, courtH, 0x2b8a3e).setStrokeStyle(8, 0xffffff);

    // Court lines
    const line = (x:number,y:number,w2:number,h2:number)=>this.add.rectangle(x,y,w2,h2,0xffffff).setOrigin(0.5).setDepth(0);
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

    // Players (circles) - me en bas côté vue
    this.me  = this.add.circle(w/2, this.courtBounds.bottom - 40, 20, 0x111111);
    this.opp = this.add.circle(w/2, this.courtBounds.top + 40, 20, 0x222244);

    // Ball
    this.ball = this.add.circle(w/2, this.courtBounds.bottom - 80, 10, 0xffde59);

    // Rackets
    this.myRacket  = this.createRacketSprite(true,  this.myHandedness);
    this.oppRacket = this.createRacketSprite(false, this.oppHandedness);

    // HUD
    this.scoreText = this.add.text(w/2, 24, '0 : 0', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#fff'
    }).setOrigin(0.5,0);

    this.furyBar = this.add.rectangle(20, h/2, 14, 0, 0xffcc00).setOrigin(0.5,1);

    // Inputs + menu
    this.setupInputHandlers();
    this.createMenuButton();

    // Mode
    if (this.isTrainingMode || !this.token) {
      this.startTrainingMode();
    } else {
      this.setupMultiplayerMode();
    }
  }

  // --------- Helpers de transform : miroir vertical autour du court ---------
  private mirrorY(y: number): number {
    // miroir autour du centre du court (BOUNDS.top/bottom)
    return this.courtBounds.top + this.courtBounds.bottom - y;
  }
  private viewToServer(x: number, y: number) {
    return (this.mySide === 'top') ? { x, y: this.mirrorY(y) } : { x, y };
  }
  private serverToView(x: number, y: number) {
    return (this.mySide === 'top') ? { x, y: this.mirrorY(y) } : { x, y };
  }

  private setupInputHandlers() {
    // Mouse/touch movement
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isTrainingMode) {
        this.handleTrainingInput(pointer);
      } else {
        // En vue: déplacer dans la moitié basse
        const minY = (this.courtBounds.top + this.courtBounds.bottom) / 2;
        const maxY = this.courtBounds.bottom - 40;

        const clampedX = Phaser.Math.Clamp(pointer.x, this.courtBounds.left + 40, this.courtBounds.right - 40);
        const clampedY = Phaser.Math.Clamp(pointer.y, minY, maxY);

        // feedback local
        this.me.setPosition(clampedX, clampedY);
        this.updateRacketPositions();

        // envoyer au serveur (J2 -> miroir)
        const s = this.viewToServer(clampedX, clampedY);
        this.sendInput({ type:'move', x:s.x, y:s.y });
      }
    });

    // Click/tap to serve
    this.input.on('pointerdown', () => {
      if (this.isTrainingMode) {
        if (this.serving) this.serveTrainingBall();
      } else if (this.serving) {
        const canServe = this.mySide === this.serverSide;
        if (canServe) this.sendInput({ type:'serve' });
        else this.showToast('Wait for your turn to serve', 1000);
      }
    });
  }

  private startTrainingMode() {
    this.showToast('🎾 Training Mode - Click to serve!', 2000);

    this.mySide = 'bottom';
    this.serving = true;
    this.serverSide = 'bottom';
    this.scoreTop = 0;
    this.scoreBottom = 0;

    // Position ball for serve
    this.resetTrainingBall();

    // Start training loop
    this.trainingLoop = this.time.addEvent({
      delay: 16,
      callback: this.updateTraining,
      callbackScope: this,
      loop: true
    });
  }

  private setupMultiplayerMode() {
    this.myUserId = decodeJwt(this.token || '')?.userId || undefined;

    const backendUrl = (window as any).IBET_BACKEND_URL ||
      (new URLSearchParams(location.search).get('api') || 'http://localhost:3001');

    if (this.token) {
      import('../network/GameSocket').then(({ GameSocket }) => {
        this.socket = new GameSocket(backendUrl, this.token);
        this.bindSocket();
        this.showToast('Searching for opponent...', 1500);
      });
    } else {
      this.showToast('Login required for multiplayer');
    }
  }

  private handleTrainingInput(pointer: Phaser.Input.Pointer) {
    const minY = (this.courtBounds.top + this.courtBounds.bottom) / 2;
    const maxY = this.courtBounds.bottom - 40;

    const clampedX = Phaser.Math.Clamp(pointer.x, this.courtBounds.left + 40, this.courtBounds.right - 40);
    const clampedY = Phaser.Math.Clamp(pointer.y, minY, maxY);

    this.me.setPosition(clampedX, clampedY);
    this.updateRacketPositions();
  }

  private serveTrainingBall() {
    if (!this.serving) return;
    this.serving = false;

    // Random serve angle
    const angle = Phaser.Math.Between(-45, -20);
    const rad = Phaser.Math.DegToRad(angle);

    this.ballVelocity.x = Math.sin(rad) * this.ballSpeed;
    this.ballVelocity.y = Math.cos(rad) * this.ballSpeed * -1;
  }

  private updateTraining() {
    if (this.serving) return;

    const deltaTime = 0.016;

    // Move ball
    this.ball.x += this.ballVelocity.x * deltaTime;
    this.ball.y += this.ballVelocity.y * deltaTime;

    // Bounce off sides
    if (this.ball.x <= this.courtBounds.left || this.ball.x >= this.courtBounds.right) {
      this.ballVelocity.x *= -1;
      this.ball.x = Phaser.Math.Clamp(this.ball.x, this.courtBounds.left, this.courtBounds.right);
    }

    // Scoring
    if (this.ball.y < this.courtBounds.top - 20) {
      this.scoreBottom++;
      this.resetTrainingBall();
      this.showToast('Point! Click to serve');
    } else if (this.ball.y > this.courtBounds.bottom + 20) {
      this.scoreTop++;
      this.resetTrainingBall();
      this.showToast('Opponent scores! Click to serve');
    }

    // Simple AI
    const oppTarget = this.ball.x;
    const oppSpeed = 200 * deltaTime;
    if (this.opp.x < oppTarget - 5) {
      this.opp.x = Math.min(this.opp.x + oppSpeed, this.courtBounds.right - 40);
    } else if (this.opp.x > oppTarget + 5) {
      this.opp.x = Math.max(this.opp.x - oppSpeed, this.courtBounds.left + 40);
    }

    const oppMinY = this.courtBounds.top + 40;
    const oppMaxY = (this.courtBounds.top + this.courtBounds.bottom) / 2 - 40;
    this.opp.y = Phaser.Math.Clamp(this.opp.y, oppMinY, oppMaxY);

    // Collisions
    this.checkTrainingCollisions();

    // UI
    this.scoreText.setText(`${this.scoreTop} : ${this.scoreBottom}`);

    // Rackets
    this.updateRacketPositions();
  }

  private checkTrainingCollisions() {
    const ballRadius = 10;
    const paddleWidth = 60;
    const paddleHeight = 20;

    if (this.ballVelocity.y > 0 &&
        Math.abs(this.ball.x - this.me.x) < paddleWidth/2 &&
        Math.abs(this.ball.y - this.me.y) < paddleHeight + ballRadius) {

      const hitPos = (this.ball.x - this.me.x) / (paddleWidth/2);
      const angle = hitPos * 45;
      const rad = Phaser.Math.DegToRad(angle);

      this.ballVelocity.x = Math.sin(rad) * this.ballSpeed;
      this.ballVelocity.y = Math.cos(rad) * this.ballSpeed * -1;

      this.ball.y = this.me.y - paddleHeight - ballRadius;
    }

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

    const centerX = this.scale.width / 2;
    const playerY = this.courtBounds.bottom - 40;
    const ballY = playerY - 40;

    this.me.setPosition(centerX, playerY);
    this.ball.setPosition(centerX, ballY);
    this.ballVelocity.x = 0;
    this.ballVelocity.y = 0;

    this.updateRacketPositions();
  }

  private createRacketSprite(isMine: boolean, handed: Handed): Phaser.GameObjects.Image | Phaser.GameObjects.Container {
    let key = '';

    if (isMine && this.textures.exists('racket_my')) key = 'racket_my';
    else if (this.textures.exists('starter-racket')) key = 'starter-racket';

    if (key) {
      const img = this.add.image(0, 0, key);
      img.setOrigin(0.5, 0.5);
      img.setScale(0.15);
      img.setDepth(3);
      return img;
    }

    // Fallback visuel
    return this.createVisualRacket(handed);
  }

  private createVisualRacket(handed: Handed): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const head = this.add.ellipse(0, -8, 16, 24, 0x8B4513);
    head.setStrokeStyle(2, 0x654321);

    const handle = this.add.rectangle(0, 6, 4, 18, 0x654321);

    for (let i = -6; i <= 6; i += 3) {
      const string = this.add.line(0, -8, i, -18, i, 2, 0xFFFFFF);
      string.setLineWidth(1);
      container.add(string);
    }

    for (let i = -16; i <= -2; i += 4) {
      const string = this.add.line(0, -8, -6, i, 6, i, 0xFFFFFF);
      string.setLineWidth(1);
      container.add(string);
    }

    const grip = this.add.rectangle(0, 12, 5, 9, 0x333333);

    for (let i = 0; i < 2; i++) {
      const gripLine = this.add.rectangle(0, 9 + i * 2, 6, 1, 0x555555);
      container.add(gripLine);
    }

    container.add([head, handle, grip]);
    container.setScale(0.6);
    container.setDepth(3);

    return container;
  }

  private createPlayerSprite(x: number, y: number, isMe: boolean): Phaser.GameObjects.Image | Phaser.GameObjects.Circle {
    let characterKey = '';
    
    if (isMe) {
      // Try equipped character first
      if (this.textures.exists('character_my')) {
        characterKey = 'character_my';
      } else {
        characterKey = 'amara'; // Default
      }
    } else {
      characterKey = 'south-park';
    }
    
    if (this.textures.exists(characterKey)) {
      const sprite = this.add.image(x, y, characterKey);
      sprite.setScale(0.12);
      sprite.setDepth(1);
      return sprite;
    }
    
    // Fallback
    const color = isMe ? 0x111111 : 0x222244;
    return this.add.circle(x, y, 20, color);
  }

  private updateRacketPositions() {
    if (this.myRacket) {
      this.positionRacket(this.myRacket, this.me.x, this.me.y, 'bottom', this.myHandedness);
    }
    if (this.oppRacket) {
      this.positionRacket(this.oppRacket, this.opp.x, this.opp.y, 'top', this.oppHandedness);
    }
  }

  private positionRacket(
    racket: Phaser.GameObjects.Image | Phaser.GameObjects.Container,
    px: number,
    py: number,
    side: PlayerSide,
    handed: Handed
  ) {
    const yOffset = side === 'bottom' ? -30 : +30;
    const xOffset = handed === 'right' ? +15 : -15;
    racket.setPosition(px + xOffset, py + yOffset);

    if (side === 'bottom') {
      racket.setRotation(handed === 'right' ? -0.2 : 0.2);
    } else {
      racket.setRotation(handed === 'right' ? 0.2 : -0.2);
    }
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

    this.add.text(w - 60, 30, 'Home', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#fff'
    }).setOrigin(0.5);

    const trainingBtn = this.add.rectangle(w - 180, 30, 100, 40, 0x2d5a27)
      .setStrokeStyle(2, 0x4a7c59)
      .setInteractive()
      .on('pointerdown', () => {
        window.location.href = '/pong?practice=true';
      })
      .on('pointerover', () => trainingBtn.setFillStyle(0x4a7c59))
      .on('pointerout', () => trainingBtn.setFillStyle(0x2d5a27));

    this.add.text(w - 180, 30, 'Practice', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#fff'
    }).setOrigin(0.5);

    const multiBtn = this.add.rectangle(w - 300, 30, 100, 40, 0x667eea)
      .setStrokeStyle(2, 0x764ba2)
      .setInteractive()
      .on('pointerdown', () => {
        window.location.href = '/pong';
      })
      .on('pointerover', () => multiBtn.setFillStyle(0x764ba2))
      .on('pointerout', () => multiBtn.setFillStyle(0x667eea));

    this.add.text(w - 300, 30, 'Multiplayer', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#fff'
    }).setOrigin(0.5);
  }

  // Multiplayer socket methods
  private bindSocket(){
    if(!this.socket) return;

    this.socket.onConnect(()=> {});
    this.socket.onConnectError(()=> {});

    this.socket.onMatchmakingStarted(()=> this.showToast('Matchmaking...'));
    this.socket.onMatchFound((m: Match)=>{
      this.assignSides(m);
      this.showToast('Match found - Get ready!', 1000);
      this.socket?.sendReady();
    });

    (this.socket as any)['socket'].on('pong_state', (state:any)=> {
      this.applyState(state);
    });

    (this.socket as any)['socket'].on('game_started', ()=> {
      this.showToast('Game started!', 800);
    });

    this.socket.findMatch('pong');
  }

  private assignSides(match: Match){
    const ids = match.players.map(p=>p.id).sort();
    const bottomId = ids[0];
    this.mySide = (this.myUserId === bottomId) ? 'bottom' : 'top';
  }

  // Lerp pour lisser l'affichage et éviter les téléports
  private smoothTo(obj: Phaser.GameObjects.Arc, x:number, y:number, a=0.35){
    obj.x = Phaser.Math.Linear(obj.x, x, a);
    obj.y = Phaser.Math.Linear(obj.y, y, a);
  }

  private applyState(s: any){
    if (!s || !s.players) return;

    if (s.serverSide === 'bottom' || s.serverSide === 'top') this.serverSide = s.serverSide;
    if (typeof s.serving === 'boolean') this.serving = s.serving;

    if (this.mySide === 'bottom') {
      if (s.players.bottom) this.smoothTo(this.me,  s.players.bottom.x, s.players.bottom.y);
      if (s.players.top)    this.smoothTo(this.opp, s.players.top.x,    s.players.top.y);
      if (s.ball) this.ball.setPosition(s.ball.x, s.ball.y);
      this.scoreBottom = s.players.bottom?.score || 0;
      this.scoreTop    = s.players.top?.score || 0;
    } else {
      // Je suis TOP → miroir pour la vue locale
      if (s.players.top) {
        const v = this.serverToView(s.players.top.x, s.players.top.y);
        this.smoothTo(this.me, v.x, v.y);
      }
      if (s.players.bottom) {
        const v = this.serverToView(s.players.bottom.x, s.players.bottom.y);
        this.smoothTo(this.opp, v.x, v.y);
      }
      if (s.ball) {
        const vb = this.serverToView(s.ball.x, s.ball.y);
        this.ball.setPosition(vb.x, vb.y);
      }
      this.scoreBottom = s.players.top?.score || 0;
      this.scoreTop    = s.players.bottom?.score || 0;
    }

    this.scoreText.setText(`${this.scoreTop} : ${this.scoreBottom}`);
    this.updateRacketPositions();

    const myData = this.mySide === 'bottom' ? s.players.bottom : s.players.top;
    if (myData && typeof myData.fury === 'number') {
      const fury = myData.fury;
      const h = Phaser.Math.Linear(0, 300, Phaser.Math.Clamp(fury,0,100)/100);
      this.furyBar.setSize(14, h);
      this.furyBar.setY(this.scale.height/2 + h/2);
    }

    if (this.serving && this.serverSide === this.mySide) {
      this.showToast('Your serve - Click to serve!', 900);
    }
  }

  private sendInput(input: any) {
    if (!this.socket || this.isTrainingMode) return;
    this.socket.sendInput(input);
  }

  private toast?: Phaser.GameObjects.Text;
  private showToast(msg:string, duration: number = 2000){
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
      duration:Math.max(800, duration * 0.4),
      delay:Math.max(400, duration * 0.6),
      onComplete: ()=> this.toast?.destroy()
    });
  }

  destroy() {
    if (this.trainingLoop) this.trainingLoop.destroy();
    super.destroy();
  }
}
