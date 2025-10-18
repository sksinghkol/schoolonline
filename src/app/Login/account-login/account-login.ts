import { Component, effect, inject, signal, Injector, runInInjectionContext, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, collection, doc, setDoc, serverTimestamp, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { SchoolStateService } from '../../core/services/school-state.service';

@Component({
  selector: 'app-account-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './account-login.html',
  styleUrl: './account-login.scss'
})
export class AccountLogin implements OnInit {
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  firestore = inject(Firestore);
  auth = inject(Auth);
  schoolState = inject(SchoolStateService);
  injector = inject(Injector);

  loginForm: FormGroup;
  isLoginView = signal(true);
  errorMessage = signal<string | null>(null);
  resolving = signal(true);
  schoolLoadError = signal<string | null>(null);

  private user = signal<User | null>(null);
  selectedSchoolSlug: string | null = null;
  selectedSchool: any = null;
  private checkingStatus = false;
  private wroteHistoryThisSession = false;

  constructor() {
    this.loginForm = this.fb.group({
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    onAuthStateChanged(this.auth, (user) => this.user.set(user));

    this.resolving.set(false);
    effect(() => {
      const user = this.user();
      const school = this.schoolState.currentSchool();
      if (user && school?.id) {
        runInInjectionContext(this.injector, () => {
          this.selectedSchool = school;
          this.checkAccountStatus(user);
        });
      } else if (school?.id) {
        this.selectedSchool = school;
      }
    });
  }

  async ngOnInit() {
    this.selectedSchoolSlug = this.route.snapshot.paramMap.get('schoolName');
    const schoolSlug = this.selectedSchoolSlug?.trim().toLowerCase();
    if (schoolSlug) {
      await this.schoolState.setSchoolBySlug(schoolSlug);
      setTimeout(() => {
        if (!this.schoolState.currentSchool()) {
          const normalized = (this.selectedSchoolSlug || '').replace(/\s+/g, '').toLowerCase(); // This part is now consistent
          this.schoolLoadError.set(
            `School not found for “${this.selectedSchoolSlug}”. Try: /account-login/${normalized} or check the school slug.`
          );
        }
      }, 1500);
      if (this.auth.currentUser) {
        this.resolving.set(true);
        this.user.set(this.auth.currentUser);
      }
    } else {
      this.schoolLoadError.set('No school provided in the URL. Use /account-login/{schoolSlug}');
    }
  }

  toggleView() {
    this.isLoginView.update(v => !v);
    this.errorMessage.set(null);
    this.loginForm.reset();

    const nameControl = this.loginForm.get('name');
    if (this.isLoginView()) {
      nameControl?.clearValidators();
    } else {
      nameControl?.setValidators([Validators.required]);
    }
    nameControl?.updateValueAndValidity();
  }

  async handleEmailPassword() {
    this.errorMessage.set(null);
    if (this.loginForm.invalid) return;

    const { email, password, name } = this.loginForm.value;

    try {
      let userCredential: User;
      if (this.isLoginView()) {
        const res = await signInWithEmailAndPassword(this.auth, email, password);
        userCredential = res.user;
        // The effect will handle the navigation after state updates.
      } else {
        const res = await createUserWithEmailAndPassword(this.auth, email, password);
        userCredential = res.user;
        // The effect will handle the navigation after state updates.
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        this.errorMessage.set('This email is already registered. Try logging in.');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        this.errorMessage.set('Incorrect email or password.');
      } else {
        this.errorMessage.set(error.message);
      }
    }
  }

  async loginWithGoogle() {
    this.errorMessage.set(null);
    const provider = new GoogleAuthProvider();
    this.resolving.set(true);
    try {
      const userCredential = await signInWithPopup(this.auth, provider);
      // The effect will handle navigation after state updates.
    } catch (error: any) {
      this.resolving.set(false);
      this.errorMessage.set(error.message);
    }
  }

  private async checkAccountStatus(user: User) {
    if (this.checkingStatus) return;

    this.checkingStatus = true;
    this.resolving.set(true);

    try {
      if (!this.selectedSchool?.id) return;

      const ref = doc(this.firestore, `schools/${this.selectedSchool.id}/accounts/${user.uid}`);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        try {
          await setDoc(ref, {
            uid: user.uid,
            email: user.email,
            name: user.displayName || this.loginForm.value.name || 'New Account',
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
            status: 'waiting-approval'
          }, { merge: true });
        } catch (e) {
          console.warn('Failed to create initial account doc', e);
        }
        this.router.navigate(['/account-awaiting-approval'], {
          queryParams: { accountId: user.uid, schoolId: this.selectedSchool.id }
        });
        return;
      }

      const accountData = snap.data() as any;
      if (!accountData?.uid) {
        try { await updateDoc(ref, { uid: user.uid }); } catch {}
      }

      switch (accountData?.status) {
        case 'approved':
          await this.saveLoginHistory(user.uid);
          this.router.navigate(['/account-dashboard'], {
            queryParams: { accountId: user.uid, schoolId: this.selectedSchool.id }
          });
          break;
        case 'waiting-approval':
        case 'default':
        default:
          this.router.navigate(['/account-awaiting-approval'], {
            queryParams: { accountId: user.uid, schoolId: this.selectedSchool.id }
          });
      }
    } finally {
      this.checkingStatus = false;
      this.resolving.set(false);
    }
  }

  private async saveLoginHistory(accountId: string) {
    if (this.wroteHistoryThisSession) return;
    try {
      const historyRef = doc(collection(this.firestore, `login_history`));
      const location = await this.getLocation();
      await setDoc(historyRef, {
        accountId,
        schoolId: this.selectedSchool.id,
        schoolCode: this.selectedSchool.code,
        role: 'account',
        loginAt: serverTimestamp(),
        device: this.getDeviceInfo(),
        location
      });
      this.wroteHistoryThisSession = true;
    } catch (e) {
      console.warn('Failed to write login history', e);
    }
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: { width: window.screen.width, height: window.screen.height }
    };
  }

  private getLocation(): Promise<{ lat: number; lng: number; accuracy?: number } | null> {
    if (!('geolocation' in navigator) || !navigator.geolocation) return Promise.resolve(null);
    return new Promise((resolve) => {
      const done = (val: { lat: number; lng: number; accuracy?: number } | null) => resolve(val);
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => done({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          () => done(null),
          { enableHighAccuracy: true, maximumAge: 300000, timeout: 5000 }
        );
      } catch {
        done(null);
      }
    });
  }
}