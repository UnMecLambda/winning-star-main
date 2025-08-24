import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Trophy, Medal, Crown } from 'lucide-angular';

import { LeaderboardComponent } from './leaderboard.component';

@NgModule({
  declarations: [
    LeaderboardComponent
  ],
  imports: [
    CommonModule,
    LucideAngularModule.pick({ Trophy, Medal, Crown }),
    RouterModule.forChild([
      { path: '', component: LeaderboardComponent }
    ])
  ]
})
export class LeaderboardModule { }