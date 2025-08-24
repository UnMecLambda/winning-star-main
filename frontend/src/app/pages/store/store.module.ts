import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ShoppingCart, Star, Coins } from 'lucide-angular';

import { StoreComponent } from './store.component';

@NgModule({
  declarations: [
    StoreComponent
  ],
  imports: [
    CommonModule,
    LucideAngularModule.pick({ ShoppingCart, Star, Coins }),
    RouterModule.forChild([
      { path: '', component: StoreComponent }
    ])
  ]
})
export class StoreModule { }