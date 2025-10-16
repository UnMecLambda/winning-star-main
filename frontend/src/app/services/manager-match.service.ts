// frontend/src/app/services/manager-match.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';

export type PbpEvent = { kind: 'shot2'|'shot3'; team: 'home'|'away'; t: number };

@Injectable({ providedIn: 'root' })
export class ManagerMatchService {
  private socket!: Socket;
  private pbp$ = new Subject<PbpEvent>();
  private ended$ = new Subject<{ matchId: string; scoreHome: number; scoreAway: number }>();

  constructor(private http: HttpClient) {
    // 👉 backend base (http://localhost:3001)
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    this.socket = io(base, { transports: ['websocket'], withCredentials: true });

    this.socket.on('connect', () => console.log('[manager-socket] connected', this.socket.id));
    this.socket.on('disconnect', () => console.log('[manager-socket] disconnected'));

    this.socket.on('match:pbp', (data: { matchId: string; ev: PbpEvent }) => {
      this.pbp$.next(data.ev);
    });
    this.socket.on('match:ended', (data: any) => {
      this.ended$.next({ matchId: data.matchId, scoreHome: data.scoreHome, scoreAway: data.scoreAway });
    });
  }

  /** Démarre un amical vs IA */
  startAIFriendly(difficulty: 'easy'|'normal'|'hard'|'legend', live = true) {
    return this.http.post<{ ok: boolean; matchId?: string }>(`${environment.apiUrl}/manager/ai/start`, {
      difficulty, live
    });
  }

  /** S’abonner à la room du match */
  joinMatch(matchId: string) {
    const room = `match:${matchId}`;
    console.log('[manager-socket] join', room);
    this.socket.emit('join_room', room);
  }

  onPbp(): Observable<PbpEvent> { return this.pbp$.asObservable(); }
  onEnded() { return this.ended$.asObservable(); }
}
