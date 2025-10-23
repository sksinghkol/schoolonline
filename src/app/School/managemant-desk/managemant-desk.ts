import { Component, EnvironmentInjector, OnInit, inject, runInInjectionContext } from '@angular/core';
import { collection, Firestore, getDocs, query, where, limit } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { SchoolStateService } from '../../core/services/school-state.service';
import { ActivatedRoute } from '@angular/router';

interface Director {
  id: string;
  name: string;
  photoURL?: string;
  email?: string;
  message?: string;
  about_director?: string;
}

interface School {
  id: string;
  name?: string;
  logoUrl?: string;
  address?: string;
}
@Component({
  selector: 'app-management-desk',
  standalone: true,
  imports: [CommonModule, QuillModule],
  templateUrl: './managemant-desk.html',
  styleUrl: './managemant-desk.scss'
})
export class ManagemantDesk implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private schoolState = inject(SchoolStateService);
  private route = inject(ActivatedRoute);
  private injector = inject(EnvironmentInjector);

  directors: Director[] = [];
  schoolData: School | null = null; // To be populated from Firestore
  isLoading = true;
  error: string | null = null;

  async ngOnInit() {
    runInInjectionContext(this.injector, async () => {
      try {
        const schoolSlug = this.route.parent?.snapshot.paramMap.get('schoolName');
        if (!schoolSlug) {
          this.error = 'School name not found in URL.';
          this.isLoading = false;
          return;
        }

        // Fetch school data based on the slug from the URL
        const schoolsCol = collection(this.firestore, 'schools');
        const schoolQuery = query(schoolsCol, where('slug', '==', schoolSlug), limit(1));
        const schoolSnapshot = await getDocs(schoolQuery);

        if (schoolSnapshot.empty) {
          this.error = `School with name "${schoolSlug}" not found.`;
          this.isLoading = false;
          return;
        }

        const schoolDoc = schoolSnapshot.docs[0];
        const school = { id: schoolDoc.id, ...schoolDoc.data() } as School;

        this.schoolData = school;

        // Firestore query to fetch approved directors
        const directorsCol = collection(this.firestore, `schools/${school.id}/directors`);
        const directorsQuery = query(directorsCol, where('status', '==', 'approved'));
        const querySnapshot = await getDocs(directorsQuery);

        // Map docs safely
        this.directors = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data['name'] || 'No Name',
            photoURL: data['photoURL'] || null,
            email: data['email'] || null,
            message: data['message'] || null,
            about_director: data['about_director'] || null
          } as Director;
        });

      } catch (err: any) {
        console.error('Error fetching directors:', err);
        if (err.code === 'permission-denied') {
          this.error = 'You do not have permission to view director profiles.';
        } else {
          this.error = 'An error occurred while fetching director profiles.';
        }
      } finally {
        this.isLoading = false;
      }
    });
  }
}
