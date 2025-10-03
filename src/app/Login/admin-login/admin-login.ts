import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.scss']
})
export class AdminLogin implements OnInit {
  loading = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Process Google redirect result here only
    this.authService.handleRedirectResult().catch(err => {
      console.error('Redirect login failed:', err);
      this.errorMessage = 'Login failed. Please try again.';
    });
  }

  /** Trigger Google login */
  async loginWithGoogle(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;

    try {
      await this.authService.googleLogin();
      // Redirect will happen → then onAuthStateChanged handles navigation
    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage = error?.message || 'Google login failed';
    } finally {
      this.loading = false;
    }
  }
}

