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
      // AuthService handles sign-in and navigation to /admin-dashboard
      await this.authService.googleLogin();
    } catch (error: any) {
      console.error(error);
      this.errorMessage = error?.message || 'Google login failed';
    } finally {
      this.loading = false;
    }
  }
}
