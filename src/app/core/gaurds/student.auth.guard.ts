import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class StudentAuthGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) {}

  canActivate(): Promise<boolean> | boolean {
    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, (user) => {
        if (user) resolve(true);
        else {
          this.router.navigate(['/student-login']);
          resolve(false);
        }
      });
    });
  }
}
