import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatchViewerComponent } from './match-viewer/match-viewer.component';

const routes: Routes = [
  { path: 'viewer', component: MatchViewerComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagerRoutingModule {}
