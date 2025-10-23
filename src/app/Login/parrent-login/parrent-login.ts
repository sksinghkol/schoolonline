import { Component, effect, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Firestore, collection, doc, setDoc, serverTimestamp, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { SchoolStateService } from '../../core/services/school-state.service';

@Component({
  selector: 'app-parrent-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './parrent-login.html',
  styleUrl: './parrent-login.scss'
})
export class ParrentLogin implements OnInit {
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  firestore = inject(Firestore);
  auth = inject(Auth);
  schoolState = inject(SchoolStateService);

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
        this.selectedSchool = school;
        this.checkParrentStatus(user);
      } else if (school?.id) {
        this.selectedSchool = school;
      }
    });
  }

  async ngOnInit() {
    this.selectedSchoolSlug = this.route.snapshot.paramMap.get('schoolName');
    const schoolSlugFromUrl = this.selectedSchoolSlug?.trim().toLowerCase();

    if (schoolSlugFromUrl) {
      this.schoolState.setSchoolBySlug(schoolSlugFromUrl);

      setTimeout(() => {
        if (!this.schoolState.currentSchool()) {
          const normalized = (this.selectedSchoolSlug || '').replace(/\s+/g, '').toLowerCase();
          this.schoolLoadError.set(`School not found for “${this.selectedSchoolSlug}”. Try: /parrent-login/${normalized} or check the school slug.`);
        }
      }, 2500);

      if (this.auth.currentUser) {
        this.resolving.set(true);
        this.user.set(this.auth.currentUser);
      }
    } else {
      this.schoolLoadError.set('No school provided in the URL. Use /parrent-login/{schoolSlug}');
      this.resolving.set(false);
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

    const { email, password } = this.loginForm.value;

    try {
      if (this.isLoginView()) {
        await signInWithEmailAndPassword(this.auth, email, password);
      } else {
        await createUserWithEmailAndPassword(this.auth, email, password);
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
      await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      this.resolving.set(false);
      this.errorMessage.set(error.message);
    }
  }

  private async checkParrentStatus(user: User) {
    if (this.checkingStatus) return;
    this.checkingStatus = true;
    this.resolving.set(true);

    try {
      if (!this.selectedSchool?.id) return;

      const ref = doc(this.firestore, `schools/${this.selectedSchool.id}/parrents/${user.uid}`);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || this.loginForm.value.name || 'New Parent',
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp(),
          status: 'waiting-approval'
        }, { merge: true });
        this.router.navigate(['/parrent-awaiting'], { queryParams: { parrentId: user.uid, schoolId: this.selectedSchool.id } });
        return;
      }

      const parrentData = snap.data() as any;
      if (!parrentData?.uid) {
        await updateDoc(ref, { uid: user.uid });
      }

      switch (parrentData?.status) {
        case 'approved':
          await this.saveLoginHistory(user.uid);
          this.router.navigate(['/parrent-dashboard'], { queryParams: { parrentId: user.uid, schoolId: this.selectedSchool.id } });
          break;
        default:
          this.router.navigate(['/parrent-awaiting'], { queryParams: { parrentId: user.uid, schoolId: this.selectedSchool.id } });
      }
    } finally {
      this.checkingStatus = false;
      this.resolving.set(false);
    }
  }

  private async saveLoginHistory(parrentId: string) {
    if (this.wroteHistoryThisSession) return;
    try {
      const historyRef = doc(collection(this.firestore, `login_history`));
      await setDoc(historyRef, {
        parrentId: parrentId,
        schoolId: this.selectedSchool.id,
        schoolCode: this.selectedSchool.code,
        role: 'Parent',
        loginAt: serverTimestamp(),
      });
      this.wroteHistoryThisSession = true;
    } catch (e) {
      console.warn('Failed to write login history', e);
    }
  }
}
