// frontend/src/app/services/manager-team.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ManagerTeamService {
  constructor(private http: HttpClient) {}
  getMyTeam() {
    return this.http.get<{ok:boolean; team:any}>('/api/manager/me/team');
  }
}
