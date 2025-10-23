import { Component, OnInit, inject, computed, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { Firestore, doc, onSnapshot, DocumentData } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { SchoolStateService } from '../../core/services/school-state.service';

@Component({
  selector: 'app-parrent-awaiting',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './parrent-awaiting.html',
  styleUrl: './parrent-awaiting.scss'
})
export class ParrentAwaiting implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  auth = inject(Auth);
  firestore = inject(Firestore);
  schoolState = inject(SchoolStateService);

  parrentId: string | null = null;
  schoolId: string | null = null;
  parrentData: DocumentData | null = null;
  isLoading: boolean = true;
  unsubscribeSnapshot: (() => void) | null = null;

  schoolName = computed(() => this.schoolState.currentSchool()?.name || 'School');
  schoolLogoUrl = computed(() => this.schoolState.currentSchool()?.logoUrl);
  schoolCodeOrSlug = computed(() => this.schoolState.currentSchool()?.slug || this.schoolState.currentSchool()?.code);

  async ngOnInit() {
    this.route.queryParamMap.subscribe(async params => {
      this.parrentId = params.get('parrentId');
      this.schoolId = params.get('schoolId');

      if (this.schoolId) {
        await this.schoolState.setSchoolById(this.schoolId);
      }

      if (this.parrentId && this.schoolId) {
        this.isLoading = true;
        const parrentDocRef = doc(this.firestore, `schools/${this.schoolId}/parrents/${this.parrentId}`);

        // Unsubscribe from previous snapshot listener if it exists
        if (this.unsubscribeSnapshot) {
          this.unsubscribeSnapshot();
        }

        this.unsubscribeSnapshot = onSnapshot(parrentDocRef, (docSnap) => {
          if (docSnap.exists()) {
            this.parrentData = docSnap.data();
            if (this.parrentData?.['status'] === 'approved') {
              this.router.navigate(['/parrent-dashboard'], {
                queryParams: { parrentId: this.parrentId, schoolId: this.schoolId }
              });
            }
          } else {
            this.parrentData = null;
          }
          this.isLoading = false;
        }, (error) => {
          console.error("Error listening to parent document:", error);
          this.isLoading = false;
        });
      } else {
        console.error("Missing parrentId or schoolId in query parameters.");
        this.isLoading = false;
        this.router.navigate(['/parrent-login', this.schoolState.currentSchool()?.slug || '']);
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
    }
  }

  async logout() {
    await signOut(this.auth);
    this.goToSchoolDashboard();
  }

 goToSchoolDashboard() {
    const v = this.schoolCodeOrSlug();
    if (v) {
      this.router.navigate([`/SchoolDashboard/${v}`]);
    } else if (this.schoolId) {
      // Fallback: if no code/slug, try using schoolId
      this.router.navigate([`/SchoolDashboard/${this.schoolId}`]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
