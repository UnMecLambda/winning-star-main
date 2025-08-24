import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Play, Users, Clock, Trophy } from 'lucide-angular';

import { PlayComponent } from './play.component';

@NgModule({
  declarations: [
    PlayComponent
  ],
  imports: [
    CommonModule,
    LucideAngularModule.pick({ Play, Users, Clock, Trophy }),
    RouterModule.forChild([
      { path: '', component: PlayComponent }
    ])
  ]
})
export class PlayModule { }