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
  private racketStats = {
    furyRate: 1,
    ballSpeed: 1,
    spin: 1,
    power: 50,
    control: 50
  };

  private lastStateSent = 0;

  constructor(token: string){
    super('game');
    this.token = token;
  }

  create(){
    const w = this.scale.width, h = this.scale.height;
    
    // Load racket stats from user data (would come from API)
    this.loadRacketStats();
    
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
      .setCircle(20).setTint(0x111111).setImmovable(true);
    this.opp = this.physics.add.image(w/2, courtY + 40, '')
      .setCircle(20).setTint(0x222244).setImmovable(true);

    this.myPaddle = this.add.rectangle(this.me.x, this.me.y - 24, 140, 16, 0xffffff).setDepth(3);
    this.oppPaddle = this.add.rectangle(this.opp.x, this.opp.y + 24, 140, 16, 0xffffff).setDepth(3);

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

    this.physics.add.overlap(this.ball, this.me, () => this.hitBall('me'));
    this.physics.add.overlap(this.ball, this.opp, () => this.hitBall('opp'));

    this.input.on('pointermove', (p: Phaser.Input.Pointer)=>{
      const targetY = Phaser.Math.Clamp(p.y, this.court.y, bottom);
      const targetX = Phaser.Math.Clamp(p.x, left+40, right-40);
      if(this.mySide==='bottom'){
        this.me.setPosition(targetX, targetY);
        this.myPaddle.setPosition(this.me.x, this.me.y - 24);
      } else {
        this.me.setPosition(targetX, Phaser.Math.Clamp(p.y, top, this.court.y));
        this.myPaddle.setPosition(this.me.x, this.me.y + 24);
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
    const base = 420 * this.racketStats.ballSpeed;
    const angle = (this.mySide==='bottom') ? Phaser.Math.Between(-50, -20) : Phaser.Math.Between(20, 50);
    const v = new Phaser.Math.Vector2();
    const powerMultiplier = 1 + (this.racketStats.power - 50) / 100;
    this.physics.velocityFromAngle(angle, base * (1 + this.fury * 0.002) * powerMultiplier, v);
    this.ball.setVelocity(v.x, v.y);
    this.sendInput({ type:'serve', vx: v.x, vy: v.y, x: this.ball.x, y: this.ball.y });
  }

  private hitBall(who: 'me'|'opp'){
    this.rallyHits++;
    // Apply racket fury rate bonus
    const furyGain = 8 * (who === 'me' ? this.racketStats.furyRate : 1);
    this.fury = Math.min(100, this.fury + furyGain);
    this.updateFuryBar();
    
    const player = (who === 'me') ? this.me : this.opp;
    const paddle = (who === 'me') ? this.myPaddle : this.oppPaddle;
    
    // Calculate hit position relative to paddle center (-1 to 1)
    const hitPos = (this.ball.x - paddle.x) / (paddle.width / 2);
    const clampedHitPos = Phaser.Math.Clamp(hitPos, -1, 1);
    
    // Calculate angle based on hit position (max 60 degrees)
    const maxAngle = 60;
    const angle = clampedHitPos * maxAngle;
    
    // Direction: up for bottom player, down for top player
    const direction = (who === 'me' && this.mySide === 'bottom') || (who === 'opp' && this.mySide === 'top') ? -1 : 1;
    
    // Calculate speed with rally progression
    const baseSpeed = 380;
    const rallyBonus = Math.min(220, this.rallyHits * 8);
    const furyBonus = this.fury * 1.5;
    
    // Apply racket bonuses
    const racketSpeedBonus = who === 'me' ? (this.racketStats.ballSpeed - 1) * baseSpeed : 0;
    const racketPowerBonus = who === 'me' ? (this.racketStats.power - 50) * 2 : 0;
    
    const speed = baseSpeed + rallyBonus + furyBonus + racketSpeedBonus + racketPowerBonus;
    
    // Convert to velocity vector
    const v = new Phaser.Math.Vector2();
    const radians = Phaser.Math.DegToRad(angle);
    v.x = Math.sin(radians) * speed;
    v.y = direction * Math.cos(radians) * speed;
    
    // Ensure minimum vertical speed to avoid horizontal balls
    const minVerticalSpeed = speed * 0.3;
    
    // Apply control bonus for more precise shots
    if (who === 'me') {
      const controlFactor = this.racketStats.control / 100;
      const angleVariation = (1 - controlFactor) * 10; // Less variation with higher control
      const randomVariation = (Math.random() - 0.5) * angleVariation;
      const adjustedRadians = Phaser.Math.DegToRad(angle + randomVariation);
      v.x = Math.sin(adjustedRadians) * speed;
      v.y = direction * Math.cos(adjustedRadians) * speed;
    }
    
    if (Math.abs(v.y) < minVerticalSpeed) {
      v.y = direction * minVerticalSpeed;
    }
    
    // Apply spin effect (visual effect for now)
    if (who === 'me' && this.racketStats.spin > 1) {
      // Add spin visual effect
      this.addSpinEffect();
    }
    
    this.ball.setVelocity(v.x, v.y);
    
    if(who==='me'){
      this.sendInput({ type:'hit', vx:v.x, vy:v.y, x:this.ball.x, y:this.ball.y, rally:this.rallyHits });
    }
  }

  private awardPoint(side: PlayerSide){
    if(side==='bottom') this.scoreBottom++; else this.scoreTop++;
    this.scoreText.setText(`${this.scoreTop} : ${this.scoreBottom}`);
    this.server = (this.server==='bottom') ? 'top' : 'bottom';
    // Reduce fury less with better racket durability
    const furyLoss = 25 * (1 - (this.racketStats.power - 50) / 200);
    this.fury = Math.max(0, this.fury - furyLoss);
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
          this.oppPaddle.setPosition(this.opp.x, this.opp.y + 24);
        } else {
          this.opp.setPosition(input.x, input.y);
          this.oppPaddle.setPosition(this.opp.x, this.opp.y - 24);
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
          this.oppPaddle.setPosition(this.opp.x, this.opp.y + 24);
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
  
  private loadRacketStats() {
    // This would normally load from the user's equipped racket via API
    // For now, we'll use default values or parse from URL params
    const params = new URLSearchParams(location.search);
    const statsParam = params.get('racketStats');
    
    if (statsParam) {
      try {
        const stats = JSON.parse(decodeURIComponent(statsParam));
        this.racketStats = {
          furyRate: stats.furyRate || 1,
          ballSpeed: stats.ballSpeed || 1,
          spin: stats.spin || 1,
          power: stats.power || 50,
          control: stats.control || 50
        };
      } catch (e) {
        console.warn('Failed to parse racket stats from URL');
      }
    }
  }
  
  private addSpinEffect() {
    // Add visual spin effect to the ball
    const spinParticles = this.add.particles(this.ball.x, this.ball.y, 'white', {
      scale: { start: 0.1, end: 0 },
      speed: { min: 20, max: 40 },
      lifespan: 200,
      quantity: 3
    });
    
    // Clean up particles after a short time
    this.time.delayedCall(300, () => {
      spinParticles.destroy();
    });
  }
}
