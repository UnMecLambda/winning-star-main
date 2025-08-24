import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Racket {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  baseStats: {
    power: number;
    control: number;
    speed: number;
    durability: number;
  };
  visualConfig: {
    frameColor: string;
    frameTexture: string;
    handleColor: string;
    handleTexture: string;
  };
}

export interface RacketComponent {
  id: string;
  name: string;
  description: string;
  type: 'strings' | 'handle' | 'grip_tape' | 'dampener';
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effects: {
    powerBonus?: number;
    controlBonus?: number;
    speedBonus?: number;
    durabilityBonus?: number;
    furyRateBonus?: number;
    ballSpeedBonus?: number;
    spinBonus?: number;
  };
  visualConfig: {
    color: string;
    texture: string;
    pattern?: string;
  };
}

export interface UserRacket {
  _id: string;
  userId: string;
  racketId: Racket;
  customization: {
    strings?: string;
    handle?: string;
    gripTape?: string;
    dampener?: string;
  };
  durability: number;
  maxDurability: number;
  totalStats: {
    power: number;
    control: number;
    speed: number;
    durability: number;
    furyRate: number;
    ballSpeed: number;
    spin: number;
  };
  gamesPlayed: number;
  isEquipped: boolean;
  purchaseDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RacketService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Shop endpoints
  getRackets(): Observable<Racket[]> {
    return this.http.get<Racket[]>(`${this.apiUrl}/rackets/shop`);
  }

  getComponents(type?: string): Observable<RacketComponent[]> {
    const params: { [key: string]: string } = {};
    if (type) {
      params['type'] = type;
    }
    return this.http.get<RacketComponent[]>(`${this.apiUrl}/rackets/components`, { params });
  }

  // User racket endpoints
  getMyRackets(): Observable<UserRacket[]> {
    return this.http.get<UserRacket[]>(`${this.apiUrl}/rackets/my-rackets`);
  }

  purchaseRacket(racketId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/rackets/purchase`, { racketId });
  }

  purchaseComponent(componentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/rackets/purchase-component`, { componentId });
  }

  customizeRacket(userRacketId: string, customization: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rackets/customize`, { userRacketId, customization });
  }

  equipRacket(userRacketId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/rackets/equip`, { userRacketId });
  }

  // Utility methods
  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return '#9CA3AF';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  }

  getRarityGradient(rarity: string): string {
    switch (rarity) {
      case 'common': return 'linear-gradient(135deg, #9CA3AF, #6B7280)';
      case 'rare': return 'linear-gradient(135deg, #3B82F6, #1D4ED8)';
      case 'epic': return 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
      case 'legendary': return 'linear-gradient(135deg, #F59E0B, #D97706)';
      default: return 'linear-gradient(135deg, #6B7280, #4B5563)';
    }
  }
}