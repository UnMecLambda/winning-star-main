import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ManagerTeamService {
  private base = environment.apiUrl; // http://localhost:3001/api

  constructor(private http: HttpClient) {}

  getMyTeam() {
    return this.http.get<{ ok: boolean; team: any }>(`${this.base}/manager/me/team`);
  }

  setStarters(starterIds: string[]) {
    return this.http.post<{ ok: boolean; starters: string[] }>(
      `${this.base}/manager/team/set-starters`,
      { starterIds }
    );
  }

  createDefaultTeam() {
    return this.http.post<{ ok: boolean; team: any }>(`${this.base}/manager/bootstrap`, {});
  }
}
