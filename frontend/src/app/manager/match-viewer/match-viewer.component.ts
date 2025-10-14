import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ManagerMatchService, PbpEvent } from '../../services/manager-match.service';
import { ManagerTeamService } from '../../services/manager-team.service';

type PlayerVm = {
  _id: string;
  name: string;
  position: 'PG'|'SG'|'SF'|'PF'|'C';
  ratingOff: number; ratingDef: number; ratingReb: number;
  speed: number; pass: number; dribble: number; threePt: number; stamina: number;
  age: number; potential: number; price: number;
};

@Component({
  selector: 'app-match-viewer',
  templateUrl: './match-viewer.component.html',
  styleUrls: ['./match-viewer.component.scss'],
})
export class MatchViewerComponent implements OnInit, OnDestroy {
  @ViewChild('court', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private subP?: Subscription;
  private subE?: Subscription;

  scoreHome = 0;
  scoreAway = 0;
  inLive = false;

  loadingTeam = true;
  team?: { _id: string; name: string; starters: PlayerVm[]; roster: PlayerVm[]; };
  starters: PlayerVm[] = [];
  roster: PlayerVm[] = [];
  picking: Set<string> = new Set();

  constructor(
    private svc: ManagerMatchService,
    private teamApi: ManagerTeamService
  ) {}

  ngOnInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.drawCourt(true);

    this.subP = this.svc.onPbp().subscribe((ev) => this.applyEvent(ev));
    this.subE = this.svc.onEnded().subscribe((end) => {
      this.inLive = false;
      this.scoreHome = end.scoreHome;
      this.scoreAway = end.scoreAway;
    });

    this.loadTeam();
  }
  ngOnDestroy() { this.subP?.unsubscribe(); this.subE?.unsubscribe(); }

  ovr(p: PlayerVm): number {
    const v = p.ratingOff*0.35 + p.ratingDef*0.25 + p.ratingReb*0.15 + p.threePt*0.10 + p.dribble*0.075 + p.pass*0.075;
    return Math.round(v);
  }

  loadTeam() {
    this.loadingTeam = true;
    this.teamApi.getMyTeam().subscribe({
      next: (r: any) => {
        this.team = r.team;
        this.starters = (r.team?.starters ?? []) as PlayerVm[];
        this.roster = (r.team?.roster ?? []) as PlayerVm[];
        this.picking = new Set(this.starters.map(s => s._id));
        this.loadingTeam = false;
      },
      error: (err) => {
        this.loadingTeam = false;
        if (err?.status === 404) this.team = undefined; // pas de team encore
      }
    });
  }

  createTeam() {
    this.loadingTeam = true;
    this.teamApi.createDefaultTeam().subscribe({
      next: () => this.loadTeam(),
      error: () => this.loadingTeam = false
    });
  }

  togglePick(id: string) {
    if (this.picking.has(id)) this.picking.delete(id);
    else {
      if (this.picking.size >= 5) return;
      this.picking.add(id);
    }
  }
  isPicked(id: string) { return this.picking.has(id); }

  saveStarters() {
    if (this.picking.size !== 5) { alert('Select exactly 5 starters.'); return; }
    const starterIds = Array.from(this.picking);
    this.teamApi.setStarters(starterIds).subscribe({
      next: () => this.loadTeam()
    });
  }

  start(diff:'easy'|'normal'|'hard'|'legend') {
    if (this.inLive) return;
    if (!this.starters || this.starters.length !== 5) {
      alert('Set 5 starters in your team first.');
      return;
    }
    this.reset();
    this.inLive = true;
    this.svc.startAIFriendly(diff, true).subscribe(r=>{
      if (r.matchId) this.svc.joinMatch(r.matchId);
    });
  }

  private reset(){ this.scoreHome=0; this.scoreAway=0; this.drawCourt(true); }

  private applyEvent(ev: PbpEvent) {
    if (ev.kind === 'shot2') { ev.team==='home' ? this.scoreHome+=2 : this.scoreAway+=2; }
    if (ev.kind === 'shot3') { ev.team==='home' ? this.scoreHome+=3 : this.scoreAway+=3; }
    this.dotRandom(ev.team);
  }

  private drawCourt(clear=false){
    const c=this.ctx, w=600, h=360;
    if (clear) c.clearRect(0,0,w,h);
    c.fillStyle = '#0b3a1e'; c.fillRect(0,0,w,h);
    c.strokeStyle = '#f0f0f0'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0,h/2); c.lineTo(w,h/2); c.stroke();
    c.beginPath(); c.arc(w/2,h/2,60,0,Math.PI*2); c.stroke();
    c.strokeRect(w*0.1,h*0.05,w*0.8, h*0.2);
    c.strokeRect(w*0.1,h*0.75,w*0.8, h*0.2);
  }

  private dotRandom(team:'home'|'away'){
    const w=600,h=360;
    const x = Math.random()*w*0.8 + w*0.1;
    const y = team==='home' ? h*0.75 + Math.random()*h*0.2 : h*0.05 + Math.random()*h*0.2;
    const color = team==='home' ? '#66ccff' : '#ffcc66';
    const c=this.ctx;
    c.fillStyle=color; c.beginPath(); c.arc(x,y,4,0,Math.PI*2); c.fill();
  }
}
