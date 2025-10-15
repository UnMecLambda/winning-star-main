import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { io as ioc, Socket } from 'socket.io-client';

export type PbpEvent = {
  kind: 'shot2'|'shot3'|'rebound'|'turnover'|'steal'|'block';
  team: 'home'|'away';
  t?: number;
};

@Injectable({ providedIn: 'root' })
export class ManagerMatchService {
  private base = environment.apiUrl; // http://localhost:3001/api
  private socket?: Socket;

  private pbp$ = new Subject<PbpEvent>();
  private ended$ = new Subject<{ matchId: string; scoreHome:number; scoreAway:number }>();

  constructor(private http: HttpClient) {
    const apiRoot = this.base.replace(/\/api\/?$/, '');
    this.socket = ioc(apiRoot, { transports: ['websocket'] });

    // ⬇️ écoute les noms d’évènements de ton live.ts
    this.socket.on('match:pbp', (payload: { matchId: string; ev: PbpEvent }) => {
      this.pbp$.next(payload.ev);
    });
    this.socket.on('match:ended', (end: { matchId: string; scoreHome:number; scoreAway:number }) => {
      this.ended$.next(end);
    });
  }

  startAIFriendly(difficulty: 'easy'|'normal'|'hard'|'legend', live = true) {
    return this.http.post<{ ok:boolean; matchId:string }>(`${this.base}/manager/ai/start`, { difficulty, live });
  }

  joinMatch(matchId: string) {
    this.socket?.emit('join_room', `match:${matchId}`);
  }

  onPbp(): Observable<PbpEvent> { return this.pbp$.asObservable(); }
  onEnded(): Observable<{ matchId: string; scoreHome:number; scoreAway:number }> { return this.ended$.asObservable(); }
}
