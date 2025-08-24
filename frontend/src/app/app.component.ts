import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, Event } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LucideAngularModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Winning Star';
  
  isAuthenticated = false;
  username = '';
  userAvatar = '/assets/avatars/default.png';
  userCoins = 0;
  
  showUserMenu = false;
  showMobileMenu = false;
  isMobile = false;
  isGameRoute = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.checkScreenSize();
  }

  ngOnInit() {
    // Check authentication status
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.loadUserData();
      }
    });

    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: Event) => {
      const navEvent = event as NavigationEnd;
      this.isGameRoute = navEvent.url.startsWith('/game') || navEvent.url.startsWith('/play') || navEvent.url.startsWith('/pong');
      this.showUserMenu = false;
      this.showMobileMenu = false;
    });

    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.loadUserData();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.showUserMenu = false;
    }
    if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-btn')) {
      this.showMobileMenu = false;
    }
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  private loadUserData() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.username = user.username;
        this.userAvatar = user.avatar || '/assets/avatars/default.png';
        this.userCoins = user.coins;
      },
      error: (error) => {
        console.error('Failed to load user data:', error);
      }
    });
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.showUserMenu = false;
    this.showMobileMenu = false;
  }
}