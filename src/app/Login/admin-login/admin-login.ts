import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { AuthService } from '../../core/services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './admin-login.html',

  styleUrls: ['./admin-login.scss']
})
export class AdminLogin {
  loading = false;
  errorMessage: string | null = null;

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private fb = inject(FormBuilder);

  constructor(private authService: AuthService, private router: Router) {}
  public loginForm: FormGroup = this.fb.group({email: ['', [Validators.required, Validators.email]],password: ['', [Validators.required, Validators.minLength(6)]]});
  isLoginView = signal(true);
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

  async handleEmailPassword() {
    this.errorMessage = null;
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    try {
      // Sign in with Email and Password
      if (this.isLoginView()) {
        await signInWithEmailAndPassword(this.auth, email, password);
        this.router.navigate(['/admin-dashboard']);
      } else {
         // Sign up with Email and Password
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

        // Create admin profile at a stable path: admins/{uid}
        try {
          const newAdminRef = doc(this.firestore, `admins/${userCredential.user.uid}`);
          await setDoc(newAdminRef, {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            createdAt: serverTimestamp(),
            role: 'admin'
          });
        } catch (e) {
          console.warn('Admin doc create failed (non-blocking)', e);
        }
      }
    } catch (error: any) {this.errorMessage = error.message;}
  }
}
