import Phaser from 'phaser';
import { GameSocket, Match } from '../network/GameSocket';

type PlayerSide = 'bottom' | 'top';

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
  private net!: Phaser.GameObjects.Rectangle;

  private ball!: Phaser.Physics.Arcade.Image;
  private me!: Phaser.Physics.Arcade.Image;
  private opp!: Phaser.Physics.Arcade.Image;
  private myPaddle!: Phaser.GameObjects.Rectangle;
  private oppPaddle!: Phaser.GameObjects.Rectangle;

  private scoreTop = 0;
  private scoreBottom = 0;
  private scoreText!: Phaser.GameObjects.Text;

  private fury = 0;
  private furyBar!: Phaser.GameObjects.Rectangle;

  private mySide: PlayerSide = 'bottom';
  private isHost = false;
  private rallyHits = 0;
  private server: PlayerSide = 'bottom';
  private serving = true;

  private lastStateSent = 0;

  constructor(token: string){
    super('game');
    this.token = token;
  }

  create(){
    const w = this.scale.width, h = this.scale.height;
    const courtMargin = 60;
    const courtW = w - courtMargin*2;
    const courtH = h - 260;
    const courtY = 100;
    this.court = this.add.rectangle(w/2, courtY + courtH/2, courtW, courtH, 0x2b8a3e).setStrokeStyle(8, 0xffffff);
    const line = (x:number,y:number,w:number,h:number)=>this.add.rectangle(x,y,w,h,0xffffff).setOrigin(0.5).setDepth(0);
    line(this.court.x, this.court.y, courtW-40, 4);
    line(this.court.x, this.court.y + courtH/2, courtW-40, 4);
    line(this.court.x, this.court.y - courtH/2, courtW-40, 4);
    line(this.court.x, this.court.y, 4, courtH-40);
    this.net = this.add.rectangle(w/2, courtY + courtH/2, courtW, 8, 0xdddddd).setDepth(2);

    this.me = this.physics.add.image(w/2, courtY + courtH - 40, '')
      .setCircle(24).setTint(0x111111).setImmovable(true);
    this.opp = this.physics.add.image(w/2, courtY + 40, '')
      .setCircle(24).setTint(0x222244).setImmovable(true);

    this.myPaddle = this.add.rectangle(this.me.x, this.me.y - 26, 120, 12, 0xffffff).setDepth(3);
    this.oppPaddle = this.add.rectangle(this.opp.x, this.opp.y + 26, 120, 12, 0xffffff).setDepth(3);

    this.ball = this.physics.add.image(w/2, h/2, '').setCircle(10).setTint(0xffde59);
    this.ball.setBounce(1, 1);
    this.ball.setCollideWorldBounds(true);

    this.scoreText = this.add.text(w/2, 24, '0 : 0', { fontFamily: 'Arial', fontSize: '28px', color: '#fff' }).setOrigin(0.5,0);
    this.furyBar = this.add.rectangle(20, h/2, 14, 0, 0xffcc00).setOrigin(0.5,1);

    const left = this.court.x - courtW/2 + 10;
    const right = this.court.x + courtW/2 - 10;
    const top = this.court.y - courtH/2 + 10;
    const bottom = this.court.y + courtH/2 - 10;
    this.physics.world.setBounds(left, top, right-left, bottom-top);

    this.physics.add.collider(this.ball, this.me, () => this.hitBall('me'));
    this.physics.add.collider(this.ball, this.opp, () => this.hitBall('opp'));

    this.input.on('pointermove', (p: Phaser.Input.Pointer)=>{
      const targetY = Phaser.Math.Clamp(p.y, this.court.y, bottom);
      const targetX = Phaser.Math.Clamp(p.x, left+40, right-40);
      if(this.mySide==='bottom'){
        this.me.setPosition(targetX, targetY);
        this.myPaddle.setPosition(this.me.x, this.me.y - 26);
      } else {
        this.me.setPosition(targetX, Phaser.Math.Clamp(p.y, top, this.court.y));
        this.myPaddle.setPosition(this.me.x, this.me.y + 26);
      }
      this.sendInput({ type:'move', x:this.me.x, y:this.me.y });
    });

    this.input.on('pointerdown', () => {
      if(this.serving && this.isMyServe()){
        this.launchServe();
      }
    });

    this.myUserId = decodeJwt(this.token || '')?.userId || undefined;
    const backendUrl = (window as any).IBET_BACKEND_URL || (new URLSearchParams(location.search).get('api') || 'http://localhost:4000');
    if(this.token){
      // lazy import to avoid SSR constraints
      import('../network/GameSocket').then(({ GameSocket }) => {
        this.socket = new GameSocket(backendUrl, this.token);
        this.bindSocket();
      });
    } else {
      this.startPractice();
    }

    window.addEventListener('pong.findMatch', ()=> this.socket?.findMatch('pong'));
    window.addEventListener('pong.practice', ()=> this.startPractice());
  }

  private bindSocket(){
    if(!this.socket) return;
    this.socket.onConnect(()=> console.log('[socket] connected'));
    this.socket.onConnectError((e)=> console.warn('[socket] error', e));
    this.socket.onMatchmakingStarted(()=> { this.resetForServe(); this.showToast('Matchmaking...'); });
    this.socket.onMatchFound((match: Match)=>{
      this.showToast('Match found');
      this.assignSides(match);
      this.resetForServe();
      this.socket?.sendReady();
    });
    this.socket.onOpponentReady(()=> this.showToast('Opponent ready'));
    this.socket.onPlayerInput((data:any)=> this.handleRemoteInput(data));
  }

  private assignSides(match: Match){
    const ids = match.players.map(p=>p.id).sort();
    const hostId = ids[0];
    this.isHost = (this.myUserId && this.myUserId === hostId) || false;
    const bottomId = ids[0];
    this.mySide = (this.myUserId === bottomId) ? 'bottom' : 'top';
  }

  private isMyServe(){ return (this.server === this.mySide); }

  private resetForServe(){
    const b = this.physics.world.bounds;
    this.ball.setVelocity(0,0);
    if(this.server==='bottom'){
      this.ball.setPosition(this.court.x, b.bottom - 80);
    } else {
      this.ball.setPosition(this.court.x, b.top + 80);
    }
    this.serving = true;
    this.rallyHits = 0;
  }

  private launchServe(){
    this.serving = false;
    const base = 420;
    const angle = (this.mySide==='bottom') ? Phaser.Math.Between(-50, -20) : Phaser.Math.Between(20, 50);
    const v = new Phaser.Math.Vector2();
    this.physics.velocityFromAngle(angle, base * (1 + this.fury * 0.002), v);
    this.ball.setVelocity(v.x, v.y);
    this.sendInput({ type:'serve', vx: v.x, vy: v.y, x: this.ball.x, y: this.ball.y });
  }

  private hitBall(who: 'me'|'opp'){
    this.rallyHits++;
    this.fury = Math.min(100, this.fury + 8);
    this.updateFuryBar();
    const speed = 380 + Math.min(220, this.rallyHits * 8) + this.fury*1.5;
    const towards = (who==='me') ? -1 : 1;
    const dx = this.ball.x - (who==='me' ? this.me.x : this.opp.x);
    const norm = Phaser.Math.Clamp(dx / 120, -0.9, 0.9);
    const angle = Phaser.Math.RadToDeg(Math.atan2(towards, norm));
    const v = new Phaser.Math.Vector2();
    this.physics.velocityFromAngle(angle, speed, v);
    this.ball.setVelocity(v.x, v.y);
    if(who==='me'){
      this.sendInput({ type:'hit', vx:v.x, vy:v.y, x:this.ball.x, y:this.ball.y, rally:this.rallyHits });
    }
  }

  private awardPoint(side: PlayerSide){
    if(side==='bottom') this.scoreBottom++; else this.scoreTop++;
    this.scoreText.setText(`${this.scoreTop} : ${this.scoreBottom}`);
    this.server = (this.server==='bottom') ? 'top' : 'bottom';
    this.fury = Math.max(0, this.fury - 25);
    this.updateFuryBar();
    this.resetForServe();
  }

  private updateFuryBar(){
    const h = Phaser.Math.Linear(0, 300, this.fury/100);
    this.furyBar.setSize(14, h);
    this.furyBar.setY(this.scale.height/2 + h/2);
  }

  private handleRemoteInput(data:any){
    const { input } = data || {};
    if(!input) return;
    switch(input.type){
      case 'move':
        if(this.mySide==='bottom'){
          this.opp.setPosition(input.x, input.y);
          this.oppPaddle.setPosition(this.opp.x, this.opp.y + 26);
        } else {
          this.opp.setPosition(input.x, input.y);
          this.oppPaddle.setPosition(this.opp.x, this.opp.y - 26);
        }
        break;
      case 'serve':
      case 'hit':
      case 'state':
        if(!this.isHost){
          if(input.x !== undefined && input.y !== undefined){
            this.ball.setPosition(input.x, input.y);
          }
          if(input.vx !== undefined && input.vy !== undefined){
            this.ball.setVelocity(input.vx, input.vy);
          }
          if(input.rally !== undefined) this.rallyHits = input.rally;
        }
        break;
    }
  }

  private sendInput(payload:any){ if(this.socket) this.socket.sendInput(payload); }

  update(time: number): void {
    const b = this.physics.world.bounds;
    if(this.ball.y < b.top + 5 && !this.serving){ this.awardPoint('bottom'); }
    else if(this.ball.y > b.bottom - 5 && !this.serving){ this.awardPoint('top'); }
    if(this.isHost && time - this.lastStateSent > 50 && !this.serving){
      this.lastStateSent = time;
      this.sendInput({ type:'state', x:this.ball.x, y:this.ball.y, vx:this.ball.body.velocity.x, vy:this.ball.body.velocity.y, rally:this.rallyHits });
    }
  }

  private startPractice(){
    this.showToast('Practice mode');
    this.mySide = 'bottom';
    this.isHost = true;
    this.server = 'bottom';
    this.resetForServe();
    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: ()=>{
        if(this.ball.y < this.court.y){
          this.opp.y = Phaser.Math.Linear(this.opp.y, this.ball.y, 0.05);
          this.opp.x = Phaser.Math.Linear(this.opp.x, this.ball.x, 0.05);
          this.oppPaddle.setPosition(this.opp.x, this.opp.y + 26);
        }
      }
    });
  }

  private toast?: Phaser.GameObjects.Text;
  private showToast(msg:string){
    if(this.toast) this.toast.destroy();
    this.toast = this.add.text(this.scale.width/2, 60, msg, { fontFamily:'Arial', fontSize:'20px', color:'#fff', backgroundColor:'#0008', padding:{x:10,y:6}}).setOrigin(0.5);
    this.tweens.add({ targets:this.toast, alpha:0, duration:1600, delay:800, onComplete: ()=> this.toast?.destroy() });
  }
}
