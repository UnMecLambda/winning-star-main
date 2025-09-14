import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShoppingCart, Star, Zap, Shield, Target, Gauge, User } from 'lucide-angular';

import { RacketShopComponent } from './racket-shop.component';
import { RacketCustomizationComponent } from './racket-customization.component';

@NgModule({
  declarations: [
    RacketShopComponent,
    RacketCustomizationComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule.pick({ ShoppingCart, Star, Zap, Shield, Target, Gauge, User }),
    RouterModule.forChild([
      { path: '', component: RacketShopComponent },
      { path: 'customize/:id', component: RacketCustomizationComponent }
    ])
  ]
})
export class RacketShopModule { }