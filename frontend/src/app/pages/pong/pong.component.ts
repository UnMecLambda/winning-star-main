import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.scss']
})
export class PongComponent {
  url: string = '';
  constructor(private auth: AuthService){
    const token = this.auth.getAccessToken();
    this.url = `${environment.gameUrl}/?token=${encodeURIComponent(token || '')}&api=${encodeURIComponent(environment.apiUrl.replace('/api',''))}`;
  }
}
