import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-super-login',
  imports: [CommonModule, RouterModule],
  templateUrl: './super-login.html',
  styleUrl: './super-login.scss'
})
export class SuperLogin {
   loading = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  async loginWithGoogle() {
    this.loading = true;
    this.errorMessage = null;

    try {
      await this.authService.googleLogin();
      // Navigate after successful login
      this.router.navigate(['/super-admin-dashboard']);
    } catch (error: any) {
      console.error(error);
      this.errorMessage = error?.message || 'Google login failed';
    } finally {
      this.loading = false;
    }
  }
}
