import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
  User as FirebaseUser,
  onAuthStateChanged,
  signOut
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface Admin {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'admin';
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<Admin | null | undefined>(undefined);

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private http = inject(HttpClient);

  constructor() {
    this.initializeAuthHandling();
  }

  /** Expose current user as observable */
  get user$() {
    return this.currentUser$.asObservable().pipe(
      filter((user): user is Admin | null => user !== undefined)
    );
  }

  /** Start Google login with redirect */
  async googleLogin(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(this.auth, provider);
  }

  /** Process redirect result (called in login component only) */
  async handleRedirectResult(): Promise<void> {
    const result = await getRedirectResult(this.auth);
    if (result?.user) {
      console.log('Redirect login successful');
      await this.saveAdminData(result.user);
      await this.saveLoginHistory(result.user);
      // ✅ यहाँ navigate नहीं करेंगे, redirect केवल authStateChanged में होगा
    }
  }

  /** Save admin data in Firestore */
  private async saveAdminData(user: FirebaseUser) {
    const adminRef = doc(this.firestore, `admin/${user.uid}`);
    const snapshot = await getDoc(adminRef);

    const adminData: Admin = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      role: 'admin',
      createdAt: serverTimestamp()
    };

    if (!snapshot.exists()) {
      await setDoc(adminRef, adminData);
      this.currentUser$.next(adminData);
    } else {
      await setDoc(
        adminRef,
        { displayName: user.displayName, photoURL: user.photoURL },
        { merge: true }
      );
      const updatedSnapshot = await getDoc(adminRef);
      if (updatedSnapshot.exists()) {
        this.currentUser$.next(updatedSnapshot.data() as Admin);
      }
    }
  }

  /** Save login history */
  private async saveLoginHistory(user: FirebaseUser) {
    try {
      const ipData: any = await firstValueFrom(
        this.http.get('https://api.ipify.org?format=json')
      );
      const ipAddress = ipData?.ip || 'Unknown';

      const geoData: any = await firstValueFrom(
        this.http.get(`https://ipapi.co/${ipAddress}/json/`)
      );
      const geoInfo = {
        country: geoData?.country_name || 'Unknown',
        region: geoData?.region || 'Unknown',
        city: geoData?.city || 'Unknown'
      };

      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android/i.test(ua);
      const browser = /Chrome/.test(ua)
        ? 'Chrome'
        : /Firefox/.test(ua)
        ? 'Firefox'
        : /Safari/.test(ua)
        ? 'Safari'
        : 'Unknown';
      const os = /Windows NT/.test(ua)
        ? 'Windows'
        : /Mac OS X/.test(ua)
        ? 'Mac OS'
        : /Android/.test(ua)
        ? 'Android'
        : 'Unknown';
      const deviceInfo = { ua, browser, os, type: isMobile ? 'Mobile' : 'Desktop' };

      const loginRecordsRef = collection(this.firestore, `admin/${user.uid}/login_records`);
      await addDoc(loginRecordsRef, {
        loginAt: serverTimestamp(),
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ipAddress,
        geoInfo,
        deviceInfo
      });
    } catch (err) {
      console.warn('Failed to log login history:', err);
    }
  }

  /** Logout */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUser$.next(null);
    this.router.navigate(['/admin-login']); // ✅ logout पर login page
  }

  /** Listen to auth state changes */
  private initializeAuthHandling() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const adminRef = doc(this.firestore, `admin/${user.uid}`);
        const snapshot = await getDoc(adminRef);

        if (snapshot.exists()) {
          this.currentUser$.next(snapshot.data() as Admin);
        } else {
          await this.saveAdminData(user);
        }

        // ✅ navigate सिर्फ login पर
        if (this.router.url === '/admin-login') {
          this.router.navigate(['/admin-dashboard']);
        }
      } else {
        this.currentUser$.next(null);
        // 🚫 logout पर auto-redirect dashboard नहीं होगा
      }
    });
  }
}
