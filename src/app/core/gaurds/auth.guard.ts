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
    return combineLatest([
      this.auth.user$,
      this.auth.loading$,
      this.auth.initialized$,
    ]).pipe(
      filter(([_, __, initialized]) => initialized), // ✅ wait till Firebase finishes
      take(1),
      map(([user]) => {
        if (user) return true;
        return this.router.createUrlTree(['/admin-login']);
      })
    );
  }
}
