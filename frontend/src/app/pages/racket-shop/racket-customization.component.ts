import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RacketService, UserRacket, RacketComponent } from '../../services/racket.service';

@Component({
  selector: 'app-racket-customization',
  templateUrl: './racket-customization.component.html',
  styleUrls: ['./racket-customization.component.scss']
})
export class RacketCustomizationComponent implements OnInit {
  userRacket?: UserRacket;
  availableComponents: { [key: string]: RacketComponent[] } = {};
  selectedComponents: any = {};
  loading = true;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private racketService: RacketService
  ) {}

  async ngOnInit() {
    const racketId = this.route.snapshot.params['id'];
    await this.loadData(racketId);
  }

  async loadData(racketId: string) {
    this.loading = true;
    try {
      const [myRackets, strings, handles, gripTapes, dampeners] = await Promise.all([
        this.racketService.getMyRackets().toPromise(),
        this.racketService.getComponents('strings').toPromise(),
        this.racketService.getComponents('handle').toPromise(),
        this.racketService.getComponents('grip_tape').toPromise(),
        this.racketService.getComponents('dampener').toPromise()
      ]);

      this.userRacket = myRackets?.find(r => r._id === racketId);
      if (!this.userRacket) {
        this.router.navigate(['/racket-shop']);
        return;
      }

      this.availableComponents = {
        strings: strings || [],
        handle: handles || [],
        grip_tape: gripTapes || [],
        dampener: dampeners || []
      };

      // Set current customization
      this.selectedComponents = { ...this.userRacket.customization };

    } catch (error) {
      console.error('Failed to load customization data:', error);
      this.router.navigate(['/racket-shop']);
    } finally {
      this.loading = false;
    }
  }

  selectComponent(type: string, componentId: string) {
    if (this.selectedComponents[type] === componentId) {
      // Deselect if already selected
      this.selectedComponents[type] = null;
    } else {
      this.selectedComponents[type] = componentId;
    }
  }

  isComponentSelected(type: string, componentId: string): boolean {
    return this.selectedComponents[type] === componentId;
  }

  getSelectedComponent(type: string): RacketComponent | null {
    const componentId = this.selectedComponents[type];
    if (!componentId) return null;
    return this.availableComponents[type]?.find(c => c.id === componentId) || null;
  }

  calculateNewStats() {
    if (!this.userRacket) return null;

    const baseStats = this.userRacket.racketId.baseStats;
    let newStats = {
      power: baseStats.power,
      control: baseStats.control,
      speed: baseStats.speed,
      durability: baseStats.durability,
      furyRate: 1,
      ballSpeed: 1,
      spin: 1
    };

    // Apply component bonuses
    Object.keys(this.selectedComponents).forEach(type => {
      const component = this.getSelectedComponent(type);
      if (component) {
        newStats.power += component.effects.powerBonus || 0;
        newStats.control += component.effects.controlBonus || 0;
        newStats.speed += component.effects.speedBonus || 0;
        newStats.durability += component.effects.durabilityBonus || 0;
        newStats.furyRate += (component.effects.furyRateBonus || 0) / 100;
        newStats.ballSpeed += (component.effects.ballSpeedBonus || 0) / 100;
        newStats.spin += (component.effects.spinBonus || 0) / 100;
      }
    });

    // Cap stats
    newStats.power = Math.min(150, Math.max(0, newStats.power));
    newStats.control = Math.min(150, Math.max(0, newStats.control));
    newStats.speed = Math.min(150, Math.max(0, newStats.speed));
    newStats.durability = Math.min(150, Math.max(0, newStats.durability));
    newStats.furyRate = Math.min(3, Math.max(0.5, newStats.furyRate));
    newStats.ballSpeed = Math.min(2, Math.max(0.5, newStats.ballSpeed));
    newStats.spin = Math.min(3, Math.max(0.5, newStats.spin));

    return newStats;
  }

  async saveCustomization() {
    if (!this.userRacket) return;

    this.saving = true;
    try {
      await this.racketService.customizeRacket(this.userRacket._id, this.selectedComponents).toPromise();
      alert('Racket customized successfully!');
      this.router.navigate(['/racket-shop']);
    } catch (error: any) {
      alert(error.error?.error || 'Failed to customize racket');
    } finally {
      this.saving = false;
    }
  }

  getRarityColor(rarity: string): string {
    return this.racketService.getRarityColor(rarity);
  }

  getStatIcon(stat: string): string {
    switch (stat) {
      case 'power': return 'zap';
      case 'control': return 'target';
      case 'speed': return 'gauge';
      case 'durability': return 'shield';
      default: return 'star';
    }
  }

  getComponentTypeIcon(type: string): string {
    switch (type) {
      case 'strings': return 'zap';
      case 'handle': return 'target';
      case 'grip_tape': return 'shield';
      case 'dampener': return 'gauge';
      default: return 'star';
    }
  }

  getEffectText(component: RacketComponent): string {
    const effects = [];
    if (component.effects.powerBonus) effects.push(`+${component.effects.powerBonus} Power`);
    if (component.effects.controlBonus) effects.push(`+${component.effects.controlBonus} Control`);
    if (component.effects.speedBonus) effects.push(`+${component.effects.speedBonus} Speed`);
    if (component.effects.durabilityBonus) effects.push(`+${component.effects.durabilityBonus} Durability`);
    if (component.effects.furyRateBonus) effects.push(`+${component.effects.furyRateBonus}% Fury Rate`);
    if (component.effects.ballSpeedBonus) effects.push(`+${component.effects.ballSpeedBonus}% Ball Speed`);
    if (component.effects.spinBonus) effects.push(`+${component.effects.spinBonus}% Spin`);
    return effects.join(', ');
  }

  getStatValue(stats: any, stat: string): number {
    return stats[stat] || 0;
  }

  isStatImproved(newStats: any, currentStats: any, stat: string): boolean {
    return this.getStatValue(newStats, stat) > this.getStatValue(currentStats, stat);
  }

  isStatDecreased(newStats: any, currentStats: any, stat: string): boolean {
    return this.getStatValue(newStats, stat) < this.getStatValue(currentStats, stat);
  }

  hasStatChanged(newStats: any, currentStats: any, stat: string): boolean {
    return this.getStatValue(newStats, stat) !== this.getStatValue(currentStats, stat);
  }
}