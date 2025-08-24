import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Package, Star } from 'lucide-angular';

import { InventoryComponent } from './inventory.component';

@NgModule({
  declarations: [
    InventoryComponent
  ],
  imports: [
    CommonModule,
    LucideAngularModule.pick({ Package, Star }),
    RouterModule.forChild([
      { path: '', component: InventoryComponent }
    ])
  ]
})
export class InventoryModule { }