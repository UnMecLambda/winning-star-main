import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerRoutingModule } from './manager-routing.module';
import { MatchViewerComponent } from './match-viewer/match-viewer.component';

@NgModule({
  declarations: [MatchViewerComponent],
  imports: [CommonModule, FormsModule, ManagerRoutingModule],
})
export class ManagerModule {}
