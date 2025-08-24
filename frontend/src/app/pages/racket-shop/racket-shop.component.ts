import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RacketService, Racket, RacketComponent, UserRacket } from '../../services/racket.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-racket-shop',
  templateUrl: './racket-shop.component.html',
  styleUrls: ['./racket-shop.component.scss']
})
export class RacketShopComponent implements OnInit {
  rackets: Racket[] = [];
  components: RacketComponent[] = [];
  myRackets: UserRacket[] = [];
  userCoins = 0;
  loading = true;
  activeTab = 'rackets';
  selectedComponentType = 'all';

  constructor(
    private racketService: RacketService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const [rackets, components, myRackets, user] = await Promise.all([
        this.racketService.getRackets().toPromise(),
        this.racketService.getComponents().toPromise(),
        this.racketService.getMyRackets().toPromise(),
        this.userService.getProfile().toPromise()
      ]);

      this.rackets = rackets || [];
      this.components = components || [];
      this.myRackets = myRackets || [];
      this.userCoins = user?.coins || 0;
    } catch (error) {
      console.error('Failed to load shop data:', error);
    } finally {
      this.loading = false;
    }
  }

  get filteredComponents() {
    if (this.selectedComponentType === 'all') {
      return this.components;
    }
    return this.components.filter(c => c.type === this.selectedComponentType);
  }

  async purchaseRacket(racket: Racket) {
    if (this.userCoins < racket.basePrice) {
      alert('Insufficient coins!');
      return;
    }

    if (this.myRackets.some(r => r.racketId.id === racket.id)) {
      alert('You already own this racket!');
      return;
    }

    try {
      const result = await this.racketService.purchaseRacket(racket.id).toPromise();
      this.userCoins = result.newBalance;
      await this.loadData(); // Refresh data
      alert(`Successfully purchased ${racket.name}!`);
    } catch (error: any) {
      alert(error.error?.error || 'Failed to purchase racket');
    }
  }

  async purchaseComponent(component: RacketComponent) {
    if (this.userCoins < component.price) {
      alert('Insufficient coins!');
      return;
    }

    try {
      const result = await this.racketService.purchaseComponent(component.id).toPromise();
      this.userCoins = result.newBalance;
      alert(`Successfully purchased ${component.name}!`);
    } catch (error: any) {
      alert(error.error?.error || 'Failed to purchase component');
    }
  }

  customizeRacket(userRacket: UserRacket) {
    this.router.navigate(['/racket-shop/customize', userRacket._id]);
  }

  async equipRacket(userRacket: UserRacket) {
    try {
      await this.racketService.equipRacket(userRacket._id).toPromise();
      await this.loadData(); // Refresh data
      alert(`${userRacket.racketId.name} equipped!`);
    } catch (error: any) {
      alert(error.error?.error || 'Failed to equip racket');
    }
  }

  getRarityColor(rarity: string): string {
    return this.racketService.getRarityColor(rarity);
  }

  getRarityGradient(rarity: string): string {
    return this.racketService.getRarityGradient(rarity);
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
}