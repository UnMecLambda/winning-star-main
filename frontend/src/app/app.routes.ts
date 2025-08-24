import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule) 
  },
  { 
    path: 'login', 
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule) 
  },
  { 
    path: 'register', 
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule) 
  },
  { 
    path: 'play', 
    loadChildren: () => import('./pages/play/play.module').then(m => m.PlayModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'store', 
    loadChildren: () => import('./pages/store/store.module').then(m => m.StoreModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'inventory', 
    loadChildren: () => import('./pages/inventory/inventory.module').then(m => m.InventoryModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'leaderboard', 
    loadChildren: () => import('./pages/leaderboard/leaderboard.module').then(m => m.LeaderboardModule) 
  },
  { 
    path: 'profile', 
    loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'transactions', 
    loadChildren: () => import('./pages/transactions/transactions.module').then(m => m.TransactionsModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'withdrawals', 
    loadChildren: () => import('./pages/withdrawals/withdrawals.module').then(m => m.WithdrawalsModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'pong',
    loadChildren: () => import('./pages/pong/pong.module').then(m => m.PongModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'racket-shop', 
    loadChildren: () => import('./pages/racket-shop/racket-shop.module').then(m => m.RacketShopModule),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/home' }
];