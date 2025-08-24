import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface GameMatch {
  gameId: string;
  gameType: string;
  players: Array<{
    id: string;
    username: string;
  }>;
  timestamp: number;
}

export interface PlayerInput {
  playerId: string;
  input: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connectedSubject = new BehaviorSubject<boolean>(false);
  
  public connected$ = this.connectedSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.socket = io(environment.apiUrl, {
    this.socket = io(environment.apiUrl.replace('/api', ''), {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to game server');
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from game server');
      this.connectedSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectedSubject.next(false);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }

  // Matchmaking
  findMatch(gameType: string): void {
    this.socket?.emit('find_match', gameType);
  }

  onMatchmakingStarted(): Observable<{ gameType: string }> {
    return new Observable(observer => {
      this.socket?.on('matchmaking_started', (data) => observer.next(data));
    });
  }

  onMatchFound(): Observable<GameMatch> {
    return new Observable(observer => {
      this.socket?.on('match_found', (data) => observer.next(data));
    });
  }

  onMatchError(): Observable<{ message: string }> {
    return new Observable(observer => {
      this.socket?.on('match_error', (data) => observer.next(data));
    });
  }

  // Game Events
  sendGameInput(gameId: string, input: any): void {
    this.socket?.emit('game_input', { gameId, input });
  }

  sendGameReady(gameId: string): void {
    this.socket?.emit('game_ready', gameId);
  }

  onPlayerInput(): Observable<PlayerInput> {
    return new Observable(observer => {
      this.socket?.on('player_input', (data) => observer.next(data));
    });
  }

  onOpponentReady(): Observable<{ playerId: string }> {
    return new Observable(observer => {
      this.socket?.on('opponent_ready', (data) => observer.next(data));
    });
  }

  // Chat
  sendChatMessage(gameId: string, message: string): void {
    this.socket?.emit('chat_message', { gameId, message });
  }

  onChatMessage(): Observable<{
    playerId: string;
    username: string;
    message: string;
    timestamp: number;
  }> {
    return new Observable(observer => {
      this.socket?.on('chat_message', (data) => observer.next(data));
    });
  }
}