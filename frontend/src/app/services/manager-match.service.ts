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
    const base = environment.apiUrl.replace(/\/api\/?$/, ''); // -> http://localhost:3001
    const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('access_token') || '' : '';

    this.socket = io(base, {
      transports: ['websocket'],
      withCredentials: true,
      path: '/socket.io',
      auth: { token },           // <- JWT via auth
      query: { token }           // <- ET via query (pour compat middleware)
    });

    this.socket.on('connect', () => console.log('[manager-socket] connected', this.socket.id));
    this.socket.on('disconnect', (r) => console.log('[manager-socket] disconnected', r));

    this.socket.on('match:pbp', (data: { matchId: string; ev: PbpEvent }) => {
      console.log('[manager-socket] pbp', data);
      this.pbp$.next(data.ev);
    });

    this.socket.on('match:ended', (data: any) => {
      console.log('[manager-socket] ended', data);
      this.ended$.next({ matchId: data.matchId, scoreHome: data.scoreHome, scoreAway: data.scoreAway });
    });
  }

  startAIFriendly(difficulty: 'easy'|'normal'|'hard'|'legend', live = true) {
    return this.http.post<{ ok: boolean; matchId?: string }>(`${environment.apiUrl}/manager/ai/start`, { difficulty, live });
  }

  joinMatch(matchId: string) {
    const room = `match:${matchId}`;
    setTimeout(() => {
      console.log('[manager-socket] join', room);
      // ACK avec timeout (err est défini si timeout)
      // @ts-ignore
      this.socket.timeout(4000).emit('join_room', room, (err: any, res?: { ok: boolean }) => {
        if (err) {
          console.warn('[manager-socket] join ack timeout → retry once', err);
          this.socket.emit('join_room', room, (res2?: { ok: boolean }) => {
            console.log('[manager-socket] join ack (retry)', res2);
          });
          return;
        }
        console.log('[manager-socket] join ack', res);
      });
    }, 400);
  }

  onPbp(): Observable<PbpEvent> { return this.pbp$.asObservable(); }
  onEnded() { return this.ended$.asObservable(); }
}
