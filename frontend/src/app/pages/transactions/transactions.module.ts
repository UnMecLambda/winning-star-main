import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, CreditCard, History } from 'lucide-angular';

import { TransactionsComponent } from './transactions.component';

@NgModule({
  declarations: [
    TransactionsComponent
  ],
  imports: [
    CommonModule,
    LucideAngularModule.pick({ CreditCard, History }),
    RouterModule.forChild([
      { path: '', component: TransactionsComponent }
    ])
  ]
})
export class TransactionsModule { }