import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SchoolStateService } from '../../core/services/school-state.service';
import { Firestore, doc, getDoc, DocumentData, updateDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-student-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './student-navbar.html',
  styleUrls: ['./student-navbar.scss']
})
export class StudentNavbar implements OnInit {
  authService = inject(AuthService);
  schoolState = inject(SchoolStateService);
  firestore = inject(Firestore);
  route = inject(ActivatedRoute);

  student: DocumentData | null = null;
  school: DocumentData | null = null;
  cartItemCount: number = 0;
  isLoading: boolean = true;

  // Reactive getters from current school
  schoolName = computed(() => this.schoolState.currentSchool()?.name || 'School');
  schoolLogoUrl = computed(() => this.schoolState.currentSchool()?.logoUrl);

  async ngOnInit() {
    // Ensure school is set from query params if provided
    const qp = this.route.snapshot.queryParamMap;
    const qpSchoolId = qp.get('schoolId');
    if (qpSchoolId && !this.schoolState.currentSchool()) {
      await this.schoolState.setSchoolById(qpSchoolId);
    }

    this.authService.user$.subscribe(async (user: User | null | DocumentData) => {
      this.isLoading = true;
      this.school = this.schoolState.currentSchool();
      const firebaseUser = user as User; // Cast to Firebase User to access uid
      
      if (firebaseUser && this.school) {
        const studentRef = doc(this.firestore, `schools/${this.school['id']}/students/${firebaseUser.uid}`);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          // Check if the Google Auth photoURL is available and different from the one in Firestore
          // or if the student has no photoURL set yet.
          if (firebaseUser.photoURL && (!studentData['photoURL'] || studentData['photoURL'] !== firebaseUser.photoURL)) {
            await updateDoc(studentRef, { photoURL: firebaseUser.photoURL });
            studentData['photoURL'] = firebaseUser.photoURL; // Update local object immediately
          }
          this.student = studentData;
        }
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
