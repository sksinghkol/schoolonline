import { Component, computed, effect, inject, Injector, OnInit, runInInjectionContext } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SchoolStateService } from '../../core/services/school-state.service';
import { doc, docData, DocumentData, Firestore, updateDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, of, from } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

function isDirectorData(data: DocumentData): data is { photoURL: string; name: string; uid: string } {
    return 'photoURL' in data && 'name' in data;
}

@Component({
  selector: 'app-director-menu',
  imports: [RouterLink, CommonModule],
  templateUrl: './director-menu.html',
  styleUrls: ['./director-menu.scss']
})
export class DirectorMenu implements OnInit {
  authService = inject(AuthService);
  schoolState = inject(SchoolStateService);
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private firebaseAuth = inject(Auth);
  private injector = inject(Injector);
  private router = inject(Router);

  director: DocumentData | null = null; // Changed from student to director
  school: DocumentData | null = null;
  cartItemCount: number = 0;
  isLoading: boolean = true;

  // Expose school details via computed getters so template reacts to signal changes
  schoolName = computed(() => this.schoolState.currentSchool()?.name || 'School');
  schoolLogoUrl = computed(() => this.schoolState.currentSchool()?.logoUrl || this.schoolState.currentSchool()?.logo);

  constructor() {
    // The logic is moved to ngOnInit for better lifecycle management.
  }

  async ngOnInit() {
    runInInjectionContext(this.injector, () => {
      toObservable(this.schoolState.currentSchool).pipe(
        switchMap(school => {
          this.school = school;
          if (school?.id) {
            try { localStorage.setItem('currentSchoolId', school.id); } catch {}
          }
          return new Promise<User | null>(resolve => onAuthStateChanged(this.firebaseAuth, resolve));
        }),
        switchMap(user => {
          this.isLoading = true;
          if (user && this.school) {
            return this.loadDirectorData(user, this.school);
          }
          return of(null);
        })
      ).subscribe(directorData => {
        this.director = directorData ?? null;
        this.isLoading = false;
      });

      // Initial school load from route
      this.route.queryParamMap.pipe(
        switchMap(params => {
          const schoolId = params.get('schoolId');
          if (schoolId && schoolId !== this.schoolState.currentSchool()?.id) {
            return from(this.schoolState.setSchoolById(schoolId));
          }
          return of(void 0);
        })
      ).subscribe();
    });
  }

  private loadDirectorData(firebaseUser: User, school: DocumentData): any {
    const directorRef = doc(this.firestore, `schools/${school['id']}/directors/${firebaseUser.uid}`);
    return docData(directorRef);
  }

  async logoutToSchoolDashboard() {
    const school = this.schoolState.currentSchool();
    const slug = school?.slug || (school?.name ? String(school.name).replace(/\s+/g, '').toLowerCase() : '');
    const redirectUrl = slug ? `/SchoolDashboard/${slug}` : '/';
    try {
      await this.authService.logout(redirectUrl);
    } catch (e) {
      // Fallback for other auth services if needed
      await this.firebaseAuth.signOut();
      this.router.navigateByUrl(redirectUrl);
    }
  }
}
