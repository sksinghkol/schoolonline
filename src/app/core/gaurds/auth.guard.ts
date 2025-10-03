import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, filter, take, switchMap } from 'rxjs/operators';
import { AuthService, Admin } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.user$.pipe(
      filter(user => user !== undefined), // Wait until the user state is determined
      take(1),
      switchMap((user: Admin | null) => {
        if (user && user.role === 'admin') {
          return of(true);
        } else {
          return of(this.router.createUrlTree(['/admin-login']));
        }
      })
    );
  }
}
