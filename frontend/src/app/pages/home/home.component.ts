import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
  isAuthenticated = false;
  onlinePlayers = 1247;
  platformStats = {
    totalPlayers: 15420,
    gamesPlayed: 89650,
    totalPayout: 12450
  };
  private intervalId?: number;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    // Simulate online players count updates (every 30 seconds)
    this.intervalId = window.setInterval(() => {
      this.onlinePlayers = Math.floor(Math.random() * 500) + 1000;
    }, 30000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}