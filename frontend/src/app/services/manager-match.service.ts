import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

export type PbpEvent = { t:number; team:'home'|'away'; kind:string; player?:string; assist?:string };
export type MatchEnded = { matchId:string; scoreHome:number; scoreAway:number; boxHome:any[]; boxAway:any[] };

@Injectable({ providedIn: 'root' })
export class ManagerMatchService {
  private socket!: Socket;
  private pbp$ = new Subject<PbpEvent>();
  private ended$ = new Subject<MatchEnded>();

  constructor(private http: HttpClient) {
    this.socket = io((window as any).env?.GAME_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      withCredentials: true,
    });
    this.socket.on('match:pbp', (m: {matchId:string; ev:PbpEvent}) => this.pbp$.next(m.ev));
    this.socket.on('match:ended', (m: MatchEnded) => this.ended$.next(m));
  }

  startAIFriendly(difficulty:'easy'|'normal'|'hard'|'legend', live:boolean) {
    return this.http.post<{ok?:boolean; matchId?:string; scoreHome?:number}>('/api/manager/ai/start', { difficulty, live });
  }
  startFriendly(opponentTeamId: string, live:boolean) {
    return this.http.post<{ok?:boolean; matchId?:string; scoreHome?:number}>('/api/manager/friendly/start', { opponentTeamId, live });
  }

  joinMatch(matchId: string) { this.socket.emit('match:join', { matchId }); }
  leaveMatch(matchId: string) { this.socket.emit('match:leave', { matchId }); }

  onPbp(): Observable<PbpEvent> { return this.pbp$.asObservable(); }
  onEnded(): Observable<MatchEnded> { return this.ended$.asObservable(); }
}
