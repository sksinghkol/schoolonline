import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.scss']
})
export class AdminLogin {
  loading = false;
  errorMessage: string | null = null;

  private auth = inject(Auth);

  constructor(private authService: AuthService, private router: Router) {}

  async loginWithGoogle() {
    this.loading = true;
    this.errorMessage = null;
    
    try {
      await this.authService.googleLogin();
      const user = this.auth.currentUser;
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        // Check for superAdmin custom claim
        if (idTokenResult.claims['superAdmin']) {
          this.router.navigate(['/super-admin-dashboard']);
        } else {
          this.router.navigate(['/admin-dashboard']);
        }
      }
    } catch (error: any) {
      console.error(error);
      this.errorMessage = error?.message || 'Google login failed';
    } finally {
      this.loading = false;
    }
  }
}
