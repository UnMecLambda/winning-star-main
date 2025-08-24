import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { RacketService } from '../../services/racket.service';

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.scss']
})
export class PongComponent {
  url: string = '';
  
  constructor(
    private auth: AuthService,
    private racketService: RacketService
  ) {
    this.loadGameWithRacketStats();
  }
  
  private async loadGameWithRacketStats() {
    const token = this.auth.getAccessToken();
    let racketStatsParam = '';
    
    try {
      // Get user's equipped racket stats
      const myRackets = await this.racketService.getMyRackets().toPromise();
      const equippedRacket = myRackets?.find(r => r.isEquipped);
      
      if (equippedRacket) {
        const racketStats = {
          furyRate: equippedRacket.totalStats.furyRate,
          ballSpeed: equippedRacket.totalStats.ballSpeed,
          spin: equippedRacket.totalStats.spin,
          power: equippedRacket.totalStats.power,
          control: equippedRacket.totalStats.control
        };
        racketStatsParam = `&racketStats=${encodeURIComponent(JSON.stringify(racketStats))}`;
      }
    } catch (error) {
      console.warn('Failed to load racket stats for game:', error);
    }
    
    this.url = `${environment.gameUrl}/?token=${encodeURIComponent(token || '')}&api=${encodeURIComponent(environment.apiUrl.replace('/api',''))}${racketStatsParam}`;
  }
}
