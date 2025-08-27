import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit {
  isSearching = false;
  connectedPlayers = 1247;

  constructor(
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.socketService.connect();
    
    this.socketService.onMatchFound().subscribe(match => {
      console.log('Match found:', match);
      this.isSearching = false;
      // Redirect to game
      this.router.navigate(['/pong']);
    });

    this.socketService.onMatchmakingStarted().subscribe(() => {
      this.isSearching = true;
    });
  }

  findMatch(gameType: string) {
    // Navigate to pong with multiplayer mode - force reload to ensure params are read
    const url = `/pong?multiplayer=true`;
    window.location.href = url;
  }

  playPong() {
    // Navigate to pong in training mode (default) - force reload
    window.location.href = '/pong';
  }

  cancelSearch() {
    this.isSearching = false;
    // TODO: Implement cancel search
  }
}