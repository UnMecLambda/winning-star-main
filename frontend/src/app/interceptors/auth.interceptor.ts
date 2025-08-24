import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for auth endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Auth request error:', error);
        return throwError(() => error);
      })
    );
  }

  const token = authService.getAccessToken();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);
      
      if (error.status === 401 && token) {
        // Try to refresh token
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry original request with new token
            const newToken = authService.getAccessToken();
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(newReq);
          }),
          catchError(() => {
            // Refresh failed, logout user
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};