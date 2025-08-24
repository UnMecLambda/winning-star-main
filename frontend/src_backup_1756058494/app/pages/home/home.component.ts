import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  isAuthenticated = false;
  onlinePlayers = 1247; // This would come from a service
  platformStats = {
    totalPlayers: 15420,
    gamesPlayed: 89650,
    totalPayout: 12450
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    // Simulate online players count updates
    setInterval(() => {
      this.onlinePlayers = Math.floor(Math.random() * 500) + 1000;
    }, 30000);
  }
}