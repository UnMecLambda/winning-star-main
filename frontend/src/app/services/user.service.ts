import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  email: string;
  username: string;
  coins: number;
  level: number;
  experience: number;
  avatar: string;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    winStreak: number;
    bestWinStreak: number;
  };
  inventory: {
    rackets: string[];
    skins: string[];
    characters: string[];
    equipment: string[];
  };
  activeLoadout: {
    racket?: string;
    character?: string;
    skin?: string;
    equipment: string[];
  };
  preferences: {
    notifications: boolean;
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
}

export interface LeaderboardUser {
  username: string;
  avatar: string;
  level: number;
  stats: {
    totalScore: number;
    gamesWon: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/profile`);
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/profile`, userData);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/stats`);
  }

  getLeaderboard(page = 1, limit = 50, type = 'score'): Observable<{
    users: LeaderboardUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.http.get<any>(`${this.apiUrl}/users/leaderboard`, {
      params: { page: page.toString(), limit: limit.toString(), type }
    });
  }
}
