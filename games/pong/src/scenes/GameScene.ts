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

  private court!: Phaser.GameObjects.Rectangle;
  private netLine!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;

  private ball!: Phaser.GameObjects.Arc;
  private me!: Phaser.GameObjects.Arc;
  private opp!: Phaser.GameObjects.Arc;

  private myRacket!: Phaser.GameObjects.Image;
  private oppRacket!: Phaser.GameObjects.Image;

  private myHandedness: Handed = 'right';
  private oppHandedness: Handed = 'right';

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
    const racketMy  = params.get('racketImg');
    const racketOpp = params.get('racketOppImg');
    const netImg    = params.get('netImg');
    if (racketMy)  this.load.image('racket_my', racketMy);
    if (racketOpp) this.load.image('racket_opp', racketOpp);
    if (netImg)    this.load.image('net_img', netImg);
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
    if(this.token){
      import('../network/GameSocket').then(() => {
        this.socket = new GameSocket(backendUrl, this.token);
        this.bindSocket();
      });
    } else {
      this.showToast('Login required for multiplayer');
    }

    // Input → envoie seulement les mouvements
    this.input.on('pointermove', (p: Phaser.Input.Pointer)=>{
      this.sendInput({ type:'move', x:p.x, y:p.y });
    });
    this.input.on('pointerdown', ()=>{
      if (this.serving && this.mySide === this.serverSide){
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
    const key = isMine && this.textures.exists('racket_my')
      ? 'racket_my'
      : (!isMine && this.textures.exists('racket_opp') ? 'racket_opp' : '');

    if (key) {
      const img = this.add.image(0, 0, key);
      img.setOrigin(handed === 'right' ? 0.15 : 0.85, 0.6);
      img.setScale(0.35);
      img.setAngle(handed === 'right' ? -15 : 15);
      img.setDepth(3);
      return img;
    }
    const fake = this.add.rectangle(0,0, 60, 10, 0x666666).setDepth(3);
    return fake as unknown as Phaser.GameObjects.Image;
  }

  private positionRacket(r: Phaser.GameObjects.Image, px: number, py: number, side: PlayerSide, handed: Handed) {
    const yOffset = side === 'bottom' ? -42 : +42;
    const xOffset = handed === 'right' ? +10 : -10;
    r.setPosition(px + xOffset, py + yOffset);
  }

  private toast?: Phaser.GameObjects.Text;
  private showToast(msg:string){
    if(this.toast) this.toast.destroy();
    this.toast = this.add.text(this.scale.width/2, 60, msg, { fontFamily:'Arial', fontSize:'20px', color:'#fff', backgroundColor:'#0008', padding:{x:10,y:6}}).setOrigin(0.5);
    this.tweens.add({ targets:this.toast, alpha:0, duration:1600, delay:800, onComplete: ()=> this.toast?.destroy() });
  }
}
