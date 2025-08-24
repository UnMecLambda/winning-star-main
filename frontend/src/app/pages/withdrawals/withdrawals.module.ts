import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, DollarSign, Banknote } from 'lucide-angular';

import { WithdrawalsComponent } from './withdrawals.component';

@NgModule({
  declarations: [
    WithdrawalsComponent
  ],
  imports: [
    CommonModule,
    LucideAngularModule.pick({ DollarSign, Banknote }),
    RouterModule.forChild([
      { path: '', component: WithdrawalsComponent }
    ])
  ]
})
export class WithdrawalsModule { }