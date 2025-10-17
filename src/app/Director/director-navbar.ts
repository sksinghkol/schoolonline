import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { SchoolStateService } from '../core/services/school-state.service';
import { Firestore, doc, getDoc, DocumentData, updateDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-director-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './director-navbar.html',
  styleUrls: ['./director-navbar.scss']
})
export class DirectorNavbar implements OnInit {
  authService = inject(AuthService);
  schoolState = inject(SchoolStateService);
  firestore = inject(Firestore);

  director: DocumentData | null = null;
  school: DocumentData | null = null;
  isLoading: boolean = true;

  async ngOnInit() {
    this.authService.user$.subscribe(async (user: User | null | DocumentData) => {
      this.isLoading = true;
      this.school = this.schoolState.currentSchool();
      const firebaseUser = user as User;

      if (firebaseUser && this.school) {
        const directorRef = doc(this.firestore, `schools/${this.school['id']}/directors/${firebaseUser.uid}`);
        const directorSnap = await getDoc(directorRef);
        if (directorSnap.exists()) {
          const directorData = directorSnap.data();

          if (firebaseUser.photoURL && (!directorData['photoURL'] || directorData['photoURL'] !== firebaseUser.photoURL)) {
            await updateDoc(directorRef, { photoURL: firebaseUser.photoURL });
            directorData['photoURL'] = firebaseUser.photoURL;
          }
          this.director = directorData;
        }
      }

      this.isLoading = false;
    });
  }
}