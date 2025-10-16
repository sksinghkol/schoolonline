import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { StudentAuthService } from '../services/student.auth.service';

@Injectable({
  providedIn: 'root'
})
export class StudentGuard implements CanActivate {
  constructor(
    private authService: StudentAuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.currentUser$.pipe(
      map(user => {
        if (!user) {
          // Not logged in
          return this.router.createUrlTree(['/login']);
        }

        if (user.role === 'student') {
          return true; // Allow students
        }

        // If logged in but not a student, redirect to home or admin dashboard
        return this.router.createUrlTree(['/']);
      })
    );
  }
}
