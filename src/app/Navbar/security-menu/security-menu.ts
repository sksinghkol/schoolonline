import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SchoolStateService } from '../../core/services/school-state.service';
import { Firestore, doc, getDoc, DocumentData, updateDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-security-menu',
  imports: [CommonModule, RouterLink],
  templateUrl: './security-menu.html',
  styleUrl: './security-menu.scss'
})
export class SecurityMenu implements OnInit {
  authService = inject(AuthService);
  schoolState = inject(SchoolStateService);
  firestore = inject(Firestore);
  route = inject(ActivatedRoute);
  firebaseAuth = inject(Auth);

  security: DocumentData | null = null; // Changed from student to director
  school: DocumentData | null = null;
  cartItemCount: number = 0;
  isLoading: boolean = true;

  // Expose school details via computed getters so template reacts to signal changes
  schoolName = computed(() => this.schoolState.currentSchool()?.name || 'School');
  schoolLogoUrl = computed(() => this.schoolState.currentSchool()?.logoUrl || this.schoolState.currentSchool()?.logo);

  async ngOnInit() {
    // Ensure school is set from query params if provided
    const qp = this.route.snapshot.queryParamMap;
    const qpSchoolId = qp.get('schoolId');
    if (qpSchoolId && !this.schoolState.currentSchool()) {
      await this.schoolState.setSchoolById(qpSchoolId);
      try { localStorage.setItem('currentSchoolId', qpSchoolId); } catch {}
    }

    // Fallback: set school by slug param if present and not set yet
    if (!this.schoolState.currentSchool()) {
      const slug = this.route.snapshot.paramMap.get('schoolName');
      if (slug) {
        this.schoolState.setSchoolBySlug(slug);
      }
    }

    // Final fallback: use persisted school id from localStorage
    if (!this.schoolState.currentSchool()) {
      try {
        const storedId = localStorage.getItem('currentSchoolId');
        if (storedId) {
          await this.schoolState.setSchoolById(storedId);
        }
      } catch {}
    }

    // Listen to Firebase auth directly (director session)
    onAuthStateChanged(this.firebaseAuth, async (firebaseUser) => {
      this.isLoading = true;
      this.school = this.schoolState.currentSchool();
      // Persist school id once known
      const sid = this.school?.['id'];
      if (sid) { try { localStorage.setItem('currentSchoolId', sid); } catch {} }
      if (firebaseUser && this.school) {
        const securityRef = doc(this.firestore, `schools/${this.school['id']}/securitys/${firebaseUser.uid}`);
        const securitySnap = await getDoc(securityRef);
        if (securitySnap.exists()) {
          const securityData = securitySnap.data();
          if (firebaseUser.photoURL && (!securityData['photoURL'] || securityData['photoURL'] !== firebaseUser.photoURL)) {
            await updateDoc(securityRef, { photoURL: firebaseUser.photoURL });
            securityData['photoURL'] = firebaseUser.photoURL;
          }
          this.security = securityData;
        } else {
          this.security = null;
        }
      } else {
        this.security = null;
      }
      this.isLoading = false;
    });
  }

  logoutToSchoolDashboard() {
    const school = this.schoolState.currentSchool();
    const slug = school?.slug || (school?.name ? String(school.name).replace(/\s+/g, '').toLowerCase() : '');
    const redirect = slug ? `/SchoolDashboard/${slug}` : '/';
    this.authService.logout(redirect);
  }
}
