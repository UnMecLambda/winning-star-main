import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Character {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  imagePath: string;
  stats: {
    speed: number;
    agility: number;
    stamina: number;
    luck: number;
  };
  effects: {
    speedBonus?: number;
    furyRateBonus?: number;
    experienceBonus?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Shop endpoints
  getCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>(`${this.apiUrl}/characters/shop`);
  }

  getMyCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>(`${this.apiUrl}/characters/my-characters`);
  }

  purchaseCharacter(characterId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/characters/purchase`, { characterId });
  }

  equipCharacter(characterId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/characters/equip`, { characterId });
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