import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
// Use Firebase Web SDK directly and access instances lazily within methods
import { getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private router: Router, private ngZone: NgZone) {}

  async loginWithGoogle(schoolCode: string) {
    try {
      const { user } = await this.ngZone.runOutsideAngular(async () => {
        // Lazily grab app, auth, and db to ensure initializeApp has completed
        const app = getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);

        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user: User = result.user;

        // Path: schools/{schoolCode}/students/{uid}
        const userRef = doc(db, `schools/${schoolCode}/students/${user.uid}`);
        // Save student data
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            schoolCode: schoolCode,
            role: 'student',
            createdAt: new Date()
          },
          { merge: true }
        );

        return { user };
      });

      this.ngZone.run(() => this.router.navigate(['/student-dashboard']));
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  async logout() {
    await this.ngZone.runOutsideAngular(async () => {
      const app = getApp();
      const auth = getAuth(app);
      await signOut(auth);
    });
    this.ngZone.run(() => this.router.navigate(['/student-login']));
  }

  getCurrentUser() {
    // currentUser lookup can be outside Angular as well
    return this.ngZone.runOutsideAngular(() => {
      const app = getApp();
      const auth = getAuth(app);
      return auth.currentUser;
    });
  }
}
