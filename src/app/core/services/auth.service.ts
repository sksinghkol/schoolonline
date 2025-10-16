import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
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
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private router = inject(Router);
  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<Admin | null>(null);
  user$ = this.currentUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject(true);
  loading$ = this.loadingSubject.asObservable();

  /** 🔸 Track if Firebase finished initial check (even if no user) */
  private initializedSubject = new BehaviorSubject(false);
  initialized$ = this.initializedSubject.asObservable();

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        await this.loadAdminData(user, true);
      } else {
        this.currentUserSubject.next(null);
      }

      this.loadingSubject.next(false);
      this.initializedSubject.next(true); // ✅ mark initialization complete
    });
  }

  async googleLogin(): Promise<void> {
    this.loadingSubject.next(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      if (user) {
        await this.loadAdminData(user, true);
        this.router.navigate(['/admin-dashboard']);
      }
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private async loadAdminData(user: FirebaseUser, saveHistory: boolean = false) {
    const adminRef = doc(this.firestore, `admin/${user.uid}`);
    const snapshot = await runInInjectionContext(this.injector, async () => getDoc(adminRef));

    const adminData: Admin = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      role: 'admin',
      createdAt: serverTimestamp(),
    };

    if (!snapshot.exists()) {
      await runInInjectionContext(this.injector, async () => setDoc(adminRef, adminData));
    } else {
      await runInInjectionContext(this.injector, async () =>
        setDoc(
          adminRef,
          { displayName: user.displayName, photoURL: user.photoURL },
          { merge: true }
        )
      );
    }

    this.currentUserSubject.next(adminData);
    if (saveHistory) {
      await this.saveLoginHistory(user);
    }
  }

  private async saveLoginHistory(user: FirebaseUser) {
    try {
      this.http.get('https://api.ipify.org?format=json').subscribe((ipData: any) => {
        const ipAddress = ipData?.ip || 'Unknown';
        this.http.get(`https://ipapi.co/${ipAddress}/json/`).subscribe(async (geoData: any) => {
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

          const now = new Date();
          const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${now.getFullYear()}`;
          const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now
            .getMinutes()
            .toString()
            .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

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

          const userLoginHistoryRef = collection(this.firestore, `admin/${user.uid}/login_records`);
          const globalLoginHistoryRef = collection(this.firestore, 'login_history');

          await runInInjectionContext(this.injector, async () => {
            await Promise.all([
              addDoc(globalLoginHistoryRef, { ...loginData, uid: user.uid }),
              addDoc(userLoginHistoryRef, loginData),
            ]);
          });
        });
      });
    } catch (err) {
      console.warn('Failed to log login history:', err);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
    this.router.navigate(['/admin-login']);
  }

  get currentUser() {
    return this.currentUserSubject.value;
  }
}
