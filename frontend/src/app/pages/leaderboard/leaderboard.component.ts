import { Component, OnInit } from '@angular/core';
import { UserService, LeaderboardUser } from '../../services/user.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  users: LeaderboardUser[] = [];
  loading = true;
  currentPage = 1;
  totalPages = 1;
  leaderboardType = 'score';

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.loading = true;
    this.userService.getLeaderboard(this.currentPage, 50, this.leaderboardType).subscribe({
      next: (response) => {
        this.users = response.users;
        this.totalPages = response.pagination.pages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load leaderboard:', error);
        this.loading = false;
      }
    });
  }

  changeType(type: string) {
    this.leaderboardType = type;
    this.currentPage = 1;
    this.loadLeaderboard();
  }

  getRankIcon(rank: number) {
    if (rank === 1) return 'crown';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'trophy';
    return null;
  }

  getRankClass(rank: number) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  }
}