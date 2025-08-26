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
    let racketVisualParam = '';
    
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
        
        // Get visual customization
        const racketVisual = await this.buildRacketVisual(equippedRacket);
        racketVisualParam = `&racket=${encodeURIComponent(JSON.stringify(racketVisual))}`;
      }
    } catch (error) {
      console.warn('Failed to load racket stats for game:', error);
    }
    
    this.url = `${environment.gameUrl}/?token=${encodeURIComponent(token || '')}&api=${encodeURIComponent(environment.apiUrl.replace('/api',''))}${racketStatsParam}${racketVisualParam}`;
  }
  
  private async buildRacketVisual(equippedRacket: any): Promise<any> {
    const visual: any = {
      imagePath: equippedRacket.racketId.imagePath, // Add image path
      frameColor: equippedRacket.racketId.visualConfig.frameColor,
      handleColor: equippedRacket.racketId.visualConfig.handleColor,
      stringsColor: '#FFFFFF' // Default strings color
    };
    
    // Add customization colors based on components
    try {
      if (equippedRacket.customization.strings) {
        const components = await this.racketService.getComponents('strings').toPromise();
        const stringsComponent = components?.find(c => c.id === equippedRacket.customization.strings);
        if (stringsComponent) {
          visual.stringsColor = stringsComponent.visualConfig.color;
        }
      }
      
      if (equippedRacket.customization.handle) {
        const components = await this.racketService.getComponents('handle').toPromise();
        const handleComponent = components?.find(c => c.id === equippedRacket.customization.handle);
        if (handleComponent) {
          visual.handleColor = handleComponent.visualConfig.color;
        }
      }
      
      if (equippedRacket.customization.gripTape) {
        const components = await this.racketService.getComponents('grip_tape').toPromise();
        const gripComponent = components?.find(c => c.id === equippedRacket.customization.gripTape);
        if (gripComponent) {
          visual.gripTape = true;
          visual.gripTapeColor = gripComponent.visualConfig.color;
        }
      }
      
      if (equippedRacket.customization.dampener) {
        const components = await this.racketService.getComponents('dampener').toPromise();
        const dampenerComponent = components?.find(c => c.id === equippedRacket.customization.dampener);
        if (dampenerComponent) {
          visual.dampener = true;
          visual.dampenerColor = dampenerComponent.visualConfig.color;
        }
      }
    } catch (error) {
      console.warn('Failed to load component visuals:', error);
    }
    
    return visual;
  }
}
