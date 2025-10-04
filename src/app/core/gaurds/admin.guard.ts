import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    // Wait for both user$ and loading$ to ensure login state is ready
    return combineLatest([this.auth.user$, this.auth.loading$]).pipe(
      filter(([user, loading]) => !loading), // proceed only when loading is false
      take(1),
      map(([user]) => {
        if (user) return true; // allow access if user exists
        return this.router.createUrlTree(['/admin-login']); // redirect if no user
      })
    );
  }
}
