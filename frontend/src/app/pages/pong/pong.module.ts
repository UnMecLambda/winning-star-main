import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PongComponent } from './pong.component';
import { PongRoutingModule } from './pong-routing.module';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@NgModule({
  declarations: [PongComponent, SafeUrlPipe],
  imports: [CommonModule, PongRoutingModule]
})
export class PongModule {}
