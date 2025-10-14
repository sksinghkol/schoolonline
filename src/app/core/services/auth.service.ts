import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
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
  private currentUserSubject = new BehaviorSubject<Admin | null>(null);
  user$ = this.currentUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject(false);
  loading$ = this.loadingSubject.asObservable();

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private router = inject(Router);
  private http = inject(HttpClient);

  constructor() {
    this.initAuthListener();
  }

  /** Listen to auth state changes */
  private initAuthListener() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        await this.loadAdminData(user);
        await this.saveLoginHistory(user);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  /** Trigger Google popup login */
  async googleLogin(): Promise<void> {
    this.loadingSubject.next(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      if (user) {
        // load admin profile; do not call saveLoginHistory here because
        // the onAuthStateChanged listener (initAuthListener) will fire
        // and perform the single canonical save. Calling both results
        // in duplicate records.
        await this.loadAdminData(user);
      }
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /** Load admin data from Firestore */
  private async loadAdminData(user: FirebaseUser) {
  const adminRef = doc(this.firestore, `admin/${user.uid}`);
  const snapshot = await runInInjectionContext(this.injector, async () => getDoc(adminRef));

    const adminData: Admin = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      role: 'admin',
      createdAt: serverTimestamp()
    };

    if (!snapshot.exists()) {
      await runInInjectionContext(this.injector, async () => setDoc(adminRef, adminData));
    } else {
      await runInInjectionContext(this.injector, async () => setDoc(adminRef, { displayName: user.displayName, photoURL: user.photoURL }, { merge: true }));
    }

    this.currentUserSubject.next(adminData);
  }

  /** Save login history with geo, device, and readable date */
  private async saveLoginHistory(user: FirebaseUser) {
    try {
      // Get IP
      const ipData: any = await firstValueFrom(this.http.get('https://api.ipify.org?format=json'));
      const ipAddress = ipData?.ip || 'Unknown';

      // Get geo location
      const geoData: any = await firstValueFrom(this.http.get(`https://ipapi.co/${ipAddress}/json/`));
      
      // Device & Browser info
      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android/i.test(ua);
      const browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Unknown';
      const os = /Windows NT/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac OS' : /Android/.test(ua) ? 'Android' : 'Unknown';
      const deviceInfo = { ua, browser, os, type: isMobile ? 'Mobile' : 'Desktop' };

      // Readable date
      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2,'0')}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getFullYear()}`;
      const formattedTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;

      const loginData = {
        loginAt: serverTimestamp(),
        formattedDate,
        formattedTime,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ipAddress,
        geoInfo: geoData,
        deviceInfo,
      };

      // Path to the user-specific subcollection
      const userLoginHistoryRef = collection(this.firestore, `admin/${user.uid}/login_records`);

      // Save to global collection
      const globalLoginHistoryRef = collection(this.firestore, 'login_history');

      // Use a Promise.all to save to both locations concurrently inside Angular injection context
      await runInInjectionContext(this.injector, async () => {
        await Promise.all([
          addDoc(globalLoginHistoryRef, { ...loginData, uid: user.uid }), // Keep uid for super-admin view
          addDoc(userLoginHistoryRef, loginData)
        ]);
      });
    } catch (err) {
      console.warn('Failed to log login history:', err);
    }
  }

  /** Logout */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
    this.router.navigate(['/admin-login']);
  }
}
