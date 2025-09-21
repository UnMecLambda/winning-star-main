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

  // avatars (images) à la place des points noirs
  private myAvatar!: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private oppAvatar!: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;

  // raquettes (petites, collées au perso)
  private myRacket!: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
  private oppRacket!: Phaser.GameObjects.Image | Phaser.GameObjects.Container;

  // hit lines (barre horizontale de renvoi)
  private myHitLine!: Phaser.GameObjects.Rectangle;
  private oppHitLine!: Phaser.GameObjects.Rectangle;

  // mini fury bars (à gauche du perso)
  private myFuryMini!: Phaser.GameObjects.Rectangle;
  private oppFuryMini!: Phaser.GameObjects.Rectangle;

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

  private mySide: PlayerSide = 'bottom';
  private serverSide: PlayerSide = 'bottom';
  private serving = true;

  // Court bounds
  private courtBounds = { left: 0, right: 0, top: 0, bottom: 0 };

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

    const params = new URLSearchParams(window.location.search);

    const practiceParam = params.get('practice');
    const isPracticeMode = practiceParam === 'true';
    const hasValidToken = this.token && this.token.length > 50;
    this.isTrainingMode = isPracticeMode || !hasValidToken;

    // racket assets
    this.load.image('starter-racket', '/assets/rackets/starter-racket.png');

    const racketData = params.get('racket');
    if (racketData) {
      try {
        const racket = JSON.parse(decodeURIComponent(racketData));
        if (racket.imagePath) this.load.image('racket_my', racket.imagePath);
      } catch (e) { console.warn('Failed to parse racket data:', e); }
    }

    // characters
    this.load.image('amara', '/assets/players/amara.png');
    this.load.image('south-park', '/assets/players/south-park.png');

    const characterData = params.get('character');
    if (characterData) {
      try {
        const character = JSON.parse(decodeURIComponent(characterData));
        if (character.imagePath) {
          const p: string = character.imagePath.startsWith('/assets')
            ? character.imagePath
            : `/assets/players/${character.imagePath}`;
          this.load.image('character_my', p);
        } else if (character.id) {
          this.load.image('character_my', `/assets/players/${character.id}.png`);
        }
      } catch (e) { console.warn('Failed to parse character data:', e); }
    }
  }

  create(){
    const w = this.scale.width, h = this.scale.height;

        // --- Layout responsive : terrain occupe la place dispo, surtout en mobile
    const isPortrait = this.scale.height > this.scale.width;
    const hudTop = 10 + (isPortrait ? 56 : 48) + 12;   // score + marge
    const margin = isPortrait ? 12 : 24;

    const courtW = this.scale.width - margin * 2;
    // ratio hauteur/largeur du court pour l'affichage (plus long que large)
    const targetRatio = 1.6; // ajuste si tu veux (1.6 à 1.8 donne bien)
    const maxCourtH = this.scale.height - hudTop - 20;
    const courtH = Math.min(maxCourtH, courtW * targetRatio);
    const courtY = hudTop + (maxCourtH - courtH) / 2;

    this.courtBounds = {
      left: w/2 - courtW/2 + 10,
      right: w/2 + courtW/2 - 10,
      top: courtY + 10,
      bottom: courtY + courtH - 10
    };

    // court
    this.court = this.add.rectangle(w/2, courtY + courtH/2, courtW, courtH, 0x2b8a3e).setStrokeStyle(8, 0xffffff);

    // lines
    const line = (x:number,y:number,w2:number,h2:number)=>this.add.rectangle(x,y,w2,h2,0xffffff).setOrigin(0.5).setDepth(0);
    line(this.court.x, this.court.y, courtW-40, 4);
    line(this.court.x, this.court.y + courtH/2, courtW-40, 4);
    line(this.court.x, this.court.y - courtH/2, courtW-40, 4);
    line(this.court.x, this.court.y, 4, courtH-40);

    // net
    if (this.textures.exists('net_img')) {
      this.netLine = this.add.image(w/2, courtY + courtH/2, 'net_img').setDisplaySize(courtW, 14).setDepth(2);
    } else {
      this.netLine = this.add.rectangle(w/2, courtY + courtH/2, courtW, 8, 0xffffff).setDepth(2);
      this.add.rectangle(w/2+2, courtY + courtH/2+2, courtW, 2, 0x000000).setAlpha(.25).setDepth(1.9);
    }

    // hitbox circles (cachés)
    this.me  = this.add.circle(w/2, this.courtBounds.bottom - 40, 20, 0x111111).setVisible(false);
    this.opp = this.add.circle(w/2, this.courtBounds.top + 40, 20, 0x222244).setVisible(false);

    // avatars
    this.myAvatar  = this.createPlayerSprite(this.me.x,  this.me.y,  true);
    this.oppAvatar = this.createPlayerSprite(this.opp.x, this.opp.y, false);

    // ball
    this.ball = this.add.circle(w/2, this.courtBounds.bottom - 80, 10, 0xffde59);

    // raquettes (petites à côté du perso)
    this.myRacket  = this.createRacketSprite(true,  this.myHandedness);
    this.oppRacket = this.createRacketSprite(false, this.oppHandedness);

    // hit lines (barres de contact)
    this.myHitLine  = this.add.rectangle(this.me.x,  this.me.y - 36, 70, 3, 0x000000).setDepth(2.2);
    this.oppHitLine = this.add.rectangle(this.opp.x, this.opp.y + 36, 70, 3, 0x000000).setDepth(2.2);

    // mini fury bars (à gauche des persos)
    this.myFuryMini  = this.add.rectangle(this.me.x - 26,  this.me.y, 6, 0, 0x000000).setOrigin(0.5,1).setDepth(2.2);
    this.oppFuryMini = this.add.rectangle(this.opp.x - 26, this.opp.y, 6, 0, 0x000000).setOrigin(0.5,0).setDepth(2.2);

    // --- HUD (score) ------------------------------------------------------------
    const isMobile = this.scale.width < 640 || this.scale.height > this.scale.width;
    const scorePanelH = isMobile ? 56 : 48;
    const scorePanelW = isMobile ? 200 : 180;

    const scoreBg = this.add.rectangle(this.scale.width/2, 10, scorePanelW, scorePanelH, 0x000000, 0.55)
      .setOrigin(0.5, 0)
      .setDepth(1000)
      .setStrokeStyle(2, 0xffffff, 0.15);

    this.scoreText = this.add.text(this.scale.width/2, 10 + scorePanelH/2, '0 : 0', {
      fontFamily: 'Arial',
      fontSize: isMobile ? '32px' : '30px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(1001);


    // Inputs + menu
    this.setupInputHandlers();
    // this.createMenuButton();

    // Mode
    if (this.isTrainingMode || !this.token) {
      this.startTrainingMode();
    } else {
      this.setupMultiplayerMode();
    }
  }

  // ---------- transforms ----------
  private mirrorY(y: number): number {
    return this.courtBounds.top + this.courtBounds.bottom - y;
  }
  private viewToServer(x: number, y: number) {
    return (this.mySide === 'top') ? { x, y: this.mirrorY(y) } : { x, y };
  }
  private serverToView(x: number, y: number) {
    return (this.mySide === 'top') ? { x, y: this.mirrorY(y) } : { x, y };
  }

  private setupInputHandlers() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isTrainingMode) {
        this.handleTrainingInput(pointer);
      } else {
        const minY = (this.courtBounds.top + this.courtBounds.bottom) / 2;
        const maxY = this.courtBounds.bottom - 40;

        const clampedX = Phaser.Math.Clamp(pointer.x, this.courtBounds.left + 40, this.courtBounds.right - 40);
        const clampedY = Phaser.Math.Clamp(pointer.y, minY, maxY);

        this.me.setPosition(clampedX, clampedY);
        this.syncAllVisuals();

        const s = this.viewToServer(clampedX, clampedY);
        this.sendInput({ type:'move', x:s.x, y:s.y });
      }
    });

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

    this.updateMiniFury(this.myFuryMini, 50, 'bottom');
    this.updateMiniFury(this.oppFuryMini, 50, 'top');

    this.resetTrainingBall();

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
    this.syncAllVisuals();
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

    const dt = 0.016;

    // Move ball
    this.ball.x += this.ballVelocity.x * dt;
    this.ball.y += this.ballVelocity.y * dt;

    // Bounce side walls
    if (this.ball.x <= this.courtBounds.left || this.ball.x >= this.courtBounds.right) {
      this.ballVelocity.x *= -1;
      this.ball.x = Phaser.Math.Clamp(this.ball.x, this.courtBounds.left, this.courtBounds.right);
    }

    // Scoring
    if (this.ball.y < this.courtBounds.top - 20) {
      this.scoreBottom++; this.resetTrainingBall(); this.showToast('Point! Click to serve');
    } else if (this.ball.y > this.courtBounds.bottom + 20) {
      this.scoreTop++; this.resetTrainingBall(); this.showToast('Opponent scores! Click to serve');
    }

    // Simple AI (opp suit x de la balle)
    const oppTarget = this.ball.x;
    const oppSpeed = 200 * dt;
    if (this.opp.x < oppTarget - 5) this.opp.x = Math.min(this.opp.x + oppSpeed, this.courtBounds.right - 40);
    else if (this.opp.x > oppTarget + 5) this.opp.x = Math.max(this.opp.x - oppSpeed, this.courtBounds.left + 40);

    const oppMinY = this.courtBounds.top + 40;
    const oppMaxY = (this.courtBounds.top + this.courtBounds.bottom) / 2 - 40;
    this.opp.y = Phaser.Math.Clamp(this.opp.y, oppMinY, oppMaxY);

    // Collisions via hit lines
    this.checkHitLineCollisions();

    // ✅ Affiche mon score à gauche en training (je suis bottom)
    this.scoreText.setText(`${this.scoreBottom} : ${this.scoreTop}`);

    // sync affichage
    this.syncAllVisuals();
  }

  // --- Collision sur la barre horizontale (hit line) ---
  private checkHitLineCollisions() {
    const lineHalf = (this.myHitLine.width || 70) / 2;
    const oppLineHalf = (this.oppHitLine.width || 70) / 2;

    // bottom player : la balle monte -> renvoi quand elle croise la ligne
    if (this.ballVelocity.y > 0 &&
        Math.abs(this.ball.x - this.me.x) < lineHalf &&
        this.ball.y >= (this.myHitLine.y - 4) && this.ball.y <= (this.myHitLine.y + 10)) {

      const hitPos = Phaser.Math.Clamp((this.ball.x - this.me.x) / lineHalf, -1, 1);
      const angle = hitPos * 45; // -45°..+45°
      const rad = Phaser.Math.DegToRad(angle);

      this.ballVelocity.x = Math.sin(rad) * this.ballSpeed;
      this.ballVelocity.y = Math.cos(rad) * this.ballSpeed * -1; // renvoi vers le haut
      this.ball.y = this.myHitLine.y - 10;
    }

    // top player : la balle descend
    if (this.ballVelocity.y < 0 &&
        Math.abs(this.ball.x - this.opp.x) < oppLineHalf &&
        this.ball.y <= (this.oppHitLine.y + 4) && this.ball.y >= (this.oppHitLine.y - 10)) {

      const hitPos = Phaser.Math.Clamp((this.ball.x - this.opp.x) / oppLineHalf, -1, 1);
      const angle = hitPos * 45;
      const rad = Phaser.Math.DegToRad(angle);

      this.ballVelocity.x = Math.sin(rad) * this.ballSpeed;
      this.ballVelocity.y = Math.cos(rad) * this.ballSpeed; // renvoi vers le bas
      this.ball.y = this.oppHitLine.y + 10;
    }
  }

  private resetTrainingBall() {
    this.serving = true;

    const centerX = this.scale.width / 2;
    const playerY = this.courtBounds.bottom - 40;
    const ballY = playerY - 40;

    this.me.setPosition(centerX, playerY);
    if (this.myAvatar) this.myAvatar.setPosition(centerX, playerY);

    this.ball.setPosition(centerX, ballY);
    this.ballVelocity.x = 0;
    this.ballVelocity.y = 0;

    this.syncAllVisuals();
  }

  private createRacketSprite(isMine: boolean, handed: Handed): Phaser.GameObjects.Image | Phaser.GameObjects.Container {
    let key = '';

    if (isMine && this.textures.exists('racket_my')) key = 'racket_my';
    else if (this.textures.exists('starter-racket')) key = 'starter-racket';

    if (key) {
      const img = this.add.image(0, 0, key);
      img.setOrigin(0.5, 0.5);
      img.setScale(0.06); // PETITE raquette
      img.setDepth(3);
      return img;
    }
    return this.createVisualRacket(handed);
  }

  private createVisualRacket(handed: Handed): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    const head = this.add.ellipse(0, -8, 16, 24, 0x8B4513).setStrokeStyle(2, 0x654321);
    const handle = this.add.rectangle(0, 6, 4, 18, 0x654321);
    for (let i = -6; i <= 6; i += 3) container.add(this.add.line(0, -8, i, -18, i, 2, 0xffffff).setLineWidth(1));
    for (let i = -16; i <= -2; i += 4) container.add(this.add.line(0, -8, -6, i, 6, i, 0xffffff).setLineWidth(1));
    const grip = this.add.rectangle(0, 12, 5, 9, 0x333333);
    container.add([head, handle, grip]);
    container.setScale(0.36);
    container.setDepth(3);
    return container;
  }

  private createPlayerSprite(x: number, y: number, isMe: boolean): Phaser.GameObjects.Image | Phaser.GameObjects.Circle {
    let characterKey = '';
    if (isMe) {
      if (this.textures.exists('character_my')) characterKey = 'character_my';
      else if (this.textures.exists('amara')) characterKey = 'amara';
    } else {
      characterKey = this.textures.exists('south-park') ? 'south-park' : 'amara';
    }
    if (characterKey && this.textures.exists(characterKey)) {
      const sprite = this.add.image(x, y, characterKey);
      sprite.setScale(0.36);
      sprite.setDepth(1);
      return sprite;
    }
    const color = isMe ? 0x111111 : 0x222244;
    return this.add.circle(x, y, 20, color);
  }

  // met à jour positions des éléments liés au joueur
  private syncAllVisuals() {
    // avatars
    if (this.myAvatar)  this.myAvatar.setPosition(this.me.x,  this.me.y);
    if (this.oppAvatar) this.oppAvatar.setPosition(this.opp.x, this.opp.y);

    // raquettes proches des persos
    this.positionRacketNextToPlayer(this.myRacket, this.me.x,  this.me.y,  'bottom', this.myHandedness);
    this.positionRacketNextToPlayer(this.oppRacket, this.opp.x, this.opp.y, 'top',    this.oppHandedness);

    // hit lines
    if (this.myHitLine)  this.myHitLine.setPosition(this.me.x,  this.me.y - 36);
    if (this.oppHitLine) this.oppHitLine.setPosition(this.opp.x, this.opp.y + 36);

    // mini fury bars
    if (this.myFuryMini)  this.myFuryMini.setPosition(this.me.x - 26,  this.me.y);
    if (this.oppFuryMini) this.oppFuryMini.setPosition(this.opp.x - 26, this.opp.y);
  }

  private positionRacketNextToPlayer(
    racket: Phaser.GameObjects.Image | Phaser.GameObjects.Container | undefined,
    px: number, py: number, side: PlayerSide, handed: Handed
  ) {
    if (!racket) return;
    const lateral = handed === 'right' ? +42 : -42;
    const vertical = side === 'bottom' ? -4 : +4;
    racket.setPosition(px + lateral, py + vertical);

    if (side === 'bottom') racket.setRotation(handed === 'right' ? -0.15 : 0.15);
    else racket.setRotation(handed === 'right' ? 0.15 : -0.15);
  }

private createMenuButton() {
  const w = this.scale.width;

  const y = 6;           // plus haut si tu veux (0..10)
  const btnW = 92;
  const btnH = 30;
  const padRight = 10;   // marge droite

  // fond du bouton
  const btn = this.add.rectangle(w - padRight, y, btnW, btnH, 0x333333, 0.95)
    .setOrigin(1, 0)     // ancré en haut-droite
    .setDepth(3000)
    .setStrokeStyle(2, 0xffffff, 0.15)
    .setInteractive()
    .on('pointerdown', () => this.quitToHome())
    .on('pointerover', () => btn.setFillStyle(0x4a4a4a, 0.95))
    .on('pointerout',  () => btn.setFillStyle(0x333333, 0.95));

  // label
  this.add.text(w - padRight - btnW / 2, y + btnH / 2, 'Home', {
    fontFamily: 'Arial',
    fontSize: '13px',
    color: '#fff',
    stroke: '#000',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(3001);

  // bonus: touche Échap pour quitter
  this.input.keyboard?.on('keydown-ESC', () => this.quitToHome());
}

private quitToHome() {
  const ok = window.confirm('Quitter la partie et revenir à l’accueil ?');
  if (!ok) return;

  // stop training loop s’il existe
  if (this.trainingLoop) {
    this.trainingLoop.remove(false);
    this.trainingLoop = undefined;
  }

  // retirer les handlers d’input pour éviter les fuites
  this.input.removeAllListeners();

  // fermer le socket si ouvert
  try {
    (this.socket as any)?.disconnect?.();
    (this.socket as any)?.close?.();
  } catch {}

  // optionnel: arrêter la scène
  this.scene.stop();

  // redirection vers ton front (change si nécessaire)
  window.location.href = window.location.origin + '/play';
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

    (this.socket as any)['socket'].on('pong_state', (state:any)=> { this.applyState(state); });
    (this.socket as any)['socket'].on('game_started', ()=> { this.showToast('Game started!', 800); });

    // ✅ Fin de partie (le back émet quand un joueur atteint 5)
    (this.socket as any)['socket'].on('game_ended', (data:any)=> {
      const iWon = data?.reason === this.mySide;
      this.showToast(iWon ? 'You win!' : 'You lose!', 2500);
      // option: désactiver les inputs
      // this.input.removeAllListeners();
    });

    this.socket.findMatch('pong');
  }

  private assignSides(match: Match){
    const ids = match.players.map(p=>p.id).sort();
    const bottomId = ids[0];
    this.mySide = (this.myUserId === bottomId) ? 'bottom' : 'top';
  }

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

    // ✅ Toujours afficher MON score à gauche
    const myScore  = this.mySide === 'bottom' ? this.scoreBottom : this.scoreTop;
    const oppScore = this.mySide === 'bottom' ? this.scoreTop    : this.scoreBottom;
    this.scoreText.setText(`${myScore} : ${oppScore}`);

    this.syncAllVisuals();

    // mini fury (si le serveur envoie fury 0..100)
    const myData = this.mySide === 'bottom' ? s.players.bottom : s.players.top;
    const oppData = this.mySide === 'bottom' ? s.players.top : s.players.bottom;
    if (myData && typeof myData.fury === 'number') this.updateMiniFury(this.myFuryMini, myData.fury, 'bottom');
    if (oppData && typeof oppData.fury === 'number') this.updateMiniFury(this.oppFuryMini, oppData.fury, 'top');

    if (this.serving && this.serverSide === this.mySide) {
      this.showToast('Your serve - Click to serve!', 900);
    }
  }

  private updateMiniFury(bar: Phaser.GameObjects.Rectangle, fury: number, side: PlayerSide) {
    const clamped = Phaser.Math.Clamp(fury, 0, 100) / 100;
    const maxH = 40;
    const h = maxH * clamped;

    if (side === 'bottom') {
      bar.setOrigin(0.5, 1);
      bar.setSize(6, h);
      bar.setFillStyle(0x000000);
    } else {
      bar.setOrigin(0.5, 0);
      bar.setSize(6, h);
      bar.setFillStyle(0x000000);
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
      fontFamily:'Arial', fontSize:'20px', color:'#fff',
      backgroundColor:'#0008', padding:{x:10,y:6}
    }).setOrigin(0.5);

    this.tweens.add({
      targets:this.toast, alpha:0,
      duration:Math.max(800, duration * 0.4),
      delay:Math.max(400, duration * 0.6),
      onComplete: ()=> this.toast?.destroy()
    });
  }

  destroy() {
    if (this.trainingLoop) this.trainingLoop.destroy();
  }
}
