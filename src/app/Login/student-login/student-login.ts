import { Component, effect, inject, signal, Injector, runInInjectionContext, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, collection, doc, setDoc, serverTimestamp, getDocs, query, where, updateDoc, getDoc } from '@angular/fire/firestore';
import { Auth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { SchoolStateService } from '../../core/services/school-state.service';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './student-login.html',
  styleUrls: ['./student-login.scss']
})
export class StudentLogin implements OnInit {
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

  constructor() {
    this.loginForm = this.fb.group({
      name: [''],
      email: ['', [Validators.required, Validators.email]], // Add validators here
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Monitor Firebase auth state
    onAuthStateChanged(this.auth, (user) => this.user.set(user));

    // When both user and school are available, check student status
    this.resolving.set(false);
    effect(() => {
      const user = this.user();
      const school = this.schoolState.currentSchool();
      if (user && school?.id) {
        runInInjectionContext(this.injector, () => {
          this.selectedSchool = school;
          this.checkStudentStatus(user);
        });
      } else if (school?.id) {
        this.selectedSchool = school;
        // this.resolving.set(false);
      }
    });
  }

  async ngOnInit() {
    this.selectedSchoolSlug = this.route.snapshot.paramMap.get('schoolName');
    if (this.selectedSchoolSlug) {
      // Load school data
      await this.schoolState.setSchoolBySlug(this.selectedSchoolSlug);
      // After a short delay, if no school resolved, show a helpful message
      setTimeout(() => {
        if (!this.schoolState.currentSchool()) {
          const normalized = (this.selectedSchoolSlug || '').replace(/\s+/g, '').toLowerCase();
          this.schoolLoadError.set(
            `School not found for “${this.selectedSchoolSlug}”. Try: /student-login/${normalized} or check the school slug.`
          );
        }
      }, 1500);
      if (this.auth.currentUser) {
        this.resolving.set(true);
        // Check student status immediately for logged-in users
        this.user.set(this.auth.currentUser);
      }
    } else {
      // When no school param is provided, guide the user instead of indefinite loading
      this.schoolLoadError.set('No school provided in the URL. Use /student-login/{schoolSlug}');
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
      } else {
        const res = await createUserWithEmailAndPassword(this.auth, email, password);
        userCredential = res.user;

        if (this.selectedSchool) {
          // Create student profile at a stable path: students/{uid}
          try {
            const newStudentRef = doc(this.firestore, `schools/${this.selectedSchool.id}/students/${userCredential.uid}`);
            await setDoc(newStudentRef, {
              uid: userCredential.uid,
              email: userCredential.email,
              name: name || 'New Student',
              photoURL: userCredential.photoURL || null,
              createdAt: serverTimestamp(),
              status: 'waiting-approval'
            }, { merge: true });
          } catch (e) {
            // Non-blocking: rules may restrict student create; handle later in update-profile
            console.warn('Student doc create failed (non-blocking)', e);
          }
        }
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
    try {
      await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      this.errorMessage.set(error.message);
    }
  }

  private async checkStudentStatus(user: User) {
    this.resolving.set(true);
    if (!this.selectedSchool?.id) return;

    // Direct read by UID-based doc ID (Option A)
    const ref = doc(this.firestore, `schools/${this.selectedSchool.id}/students/${user.uid}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // No profile yet → auto-create pending approval and route to awaiting-approval
      try {
        await setDoc(ref, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || this.loginForm.value.name || 'New Student',
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp(),
          status: 'waiting-approval'
        }, { merge: true });
      } catch (e) {
        console.warn('Failed to create initial student doc', e);
      }
      this.resolving.set(false);
      this.router.navigate(['/awaiting-approval'], {
        queryParams: { studentId: user.uid, schoolId: this.selectedSchool.id }
      });
      return;
    }

    const studentData = snap.data() as any;
    // Backfill uid if missing (non-blocking)
    if (!studentData?.uid) {
      try { await updateDoc(ref, { uid: user.uid }); } catch {}
    }

    switch (studentData?.status) {
      case 'approved':
        await this.saveLoginHistory(user.uid);
        this.router.navigate(['/student-dashboard'], {
          queryParams: { studentId: user.uid, schoolId: this.selectedSchool.id }
        });
        break;
      case 'waiting-approval':
        this.router.navigate(['/awaiting-approval'], {
          queryParams: { studentId: user.uid, schoolId: this.selectedSchool.id }
        });
        break;
      default:
        // If status field missing or other value, treat as pending approval by default
        try { await updateDoc(ref, { status: 'waiting-approval' }); } catch {}
        this.router.navigate(['/awaiting-approval'], {
          queryParams: { studentId: user.uid, schoolId: this.selectedSchool.id }
        });
    }
  }

  private async saveLoginHistory(studentId: string) {
    try {
      const historyRef = doc(collection(this.firestore, `login_history`));
      await setDoc(historyRef, {
        studentId,
        schoolCode: this.selectedSchool.code,
        loginAt: serverTimestamp(),
        device: this.getDeviceInfo()
      });
    } catch (e) {
      // Do not block login flow if history write fails
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
}
