import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RacketService, Racket, RacketComponent, UserRacket, RentalRacket } from '../../services/racket.service';
import { CharacterService, Character } from '../../services/character.service';
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
  characters: Character[] = [];
  myCharacters: Character[] = [];
  userCoins = 0;
  loading = true;
  activeTab = 'rackets';
  selectedComponentType = 'all';

  // Rental properties
  rentalMarket: RentalRacket[] = [];
  myRentals: RentalRacket[] = [];
  showRentModal = false;
  selectedRacketForRent?: UserRacket;
  rentPrice = 100;
  rentDuration = 24; // hours

  constructor(
    private racketService: RacketService,
    private characterService: CharacterService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      const [rackets, components, myRackets, characters, myCharacters, user, rentalMarket, myRentals] = await Promise.all([
        this.racketService.getRackets().toPromise(),
        this.racketService.getComponents().toPromise(),
        this.racketService.getMyRackets().toPromise(),
        this.characterService.getCharacters().toPromise(),
        this.characterService.getMyCharacters().toPromise(),
        this.userService.getProfile().toPromise(),
        this.racketService.getRentalMarket().toPromise(),
        this.racketService.getMyRentalsWithOwner().toPromise()
      ]);

      this.rackets = rackets || [];
      this.components = components || [];
      this.myRackets = myRackets || [];
      this.characters = characters || [];
      this.myCharacters = myCharacters || [];
      this.userCoins = user?.coins || 0;
      this.rentalMarket = rentalMarket?.rackets || [];
      this.myRentals = myRentals || [];
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

  openRentModal(userRacket: UserRacket) {
    this.selectedRacketForRent = userRacket;
    this.showRentModal = true;
  }

  closeRentModal() {
    this.showRentModal = false;
    this.selectedRacketForRent = undefined;
    this.rentPrice = 100;
    this.rentDuration = 24;
  }

  async setForRent() {
    if (!this.selectedRacketForRent) return;

    try {
      await this.racketService.setForRent(
        this.selectedRacketForRent._id, 
        this.rentPrice, 
        this.rentDuration
      ).toPromise();
      
      await this.loadData(); // Refresh data
      this.closeRentModal();
      alert('Racket set for rent successfully!');
    } catch (error: any) {
      alert(error.error?.error || 'Failed to set racket for rent');
    }
  }

  async rentRacket(racket: any) {
    if (this.userCoins < racket.rentPrice) {
      alert('Insufficient coins!');
      return;
    }

    try {
      const result = await this.racketService.rentRacket(racket._id).toPromise();
      this.userCoins = result.newBalance;
      await this.loadData(); // Refresh data
      alert(`Successfully rented ${racket.racketId.name}!`);
    } catch (error: any) {
      alert(error.error?.error || 'Failed to rent racket');
    }
  }

  async removeFromRent(userRacket: UserRacket) {
    try {
      await this.racketService.removeFromRent(userRacket._id).toPromise();
      await this.loadData(); // Refresh data
      alert('Racket removed from rental market!');
    } catch (error: any) {
      alert(error.error?.error || 'Failed to remove racket from rent');
    }
  }

  async purchaseCharacter(character: Character) {
    if (character.price > 0 && this.userCoins < character.price) {
      alert('Insufficient coins!');
      return;
    }

    if (this.myCharacters.some(c => c.id === character.id)) {
      alert('You already own this character!');
      return;
    }

    try {
      const result = await this.characterService.purchaseCharacter(character.id).toPromise();
      this.userCoins = result.newBalance;
      await this.loadData(); // Refresh data
      alert(`Successfully obtained ${character.name}!`);
    } catch (error: any) {
      alert(error.error?.error || 'Failed to obtain character');
    }
  }

  async equipCharacter(character: Character) {
    try {
      await this.characterService.equipCharacter(character.id).toPromise();
      alert(`${character.name} equipped!`);
    } catch (error: any) {
      alert(error.error?.error || 'Failed to equip character');
    }
  }

  isCharacterOwned(character: Character): boolean {
    return this.myCharacters.some(c => c.id === character.id);
  }

  canPurchaseCharacter(character: Character): boolean {
    return (character.price === 0 || this.userCoins >= character.price) && !this.isCharacterOwned(character);
  }

  getRarityColor(rarity: string): string {
    return this.racketService.getRarityColor(rarity);
  }

  getRarityGradient(rarity: string): string {
    return this.racketService.getRarityGradient(rarity);
  }

  isRacketOwned(racket: Racket): boolean {
    return this.myRackets.some(r => r.racketId.id === racket.id);
  }

  canPurchaseRacket(racket: Racket): boolean {
    return this.userCoins >= racket.basePrice && !this.isRacketOwned(racket);
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

  getStatValue(stats: any, stat: string): number {
    return stats[stat] || 0;
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