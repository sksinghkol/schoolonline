import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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

interface Principal {
  id: string;
  name: string;
  photoURL?: string;
  email?: string;
  message?: string;
  about_principal?: string;
}


interface School {
  id: string;
  name?: string;
  slug?: string;
  logoUrl?: string;
  address?: string;
}

@Component({
  selector: 'app-management-desk',
  standalone: true,
  imports: [CommonModule, QuillModule],
  templateUrl: './managemant-desk.html',
  styleUrls: ['./managemant-desk.scss']
})
export class ManagementDesk implements OnInit {
  private firestore = inject(Firestore);
  private schoolState = inject(SchoolStateService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  directors: Director[] = [];
  principals: Principal[] = [];
  schoolData: School | null = null;
  isLoading = true;
  error: string | null = null;

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(async (params) => {
      const schoolSlug = params.get('schoolName');
      if (schoolSlug) { 
        await this.loadLeadership(schoolSlug);
      } else {
        this.error = 'School name not found in the URL.';
        this.isLoading = false;
      }
    });
  }

  trackByDirectorId(index: number, director: Director): string {
    return director.id;
  }

  trackByPrincipalId(index: number, principal: Principal): string {
    return principal.id;
  }

  async refreshDirectors() {
    // Prevent spamming the refresh button
    if (this.isLoading) {
      return;
    }
    const schoolSlug = this.schoolData?.slug;
    if (schoolSlug) { 
      await this.loadLeadership(schoolSlug);
    }
  }

  private async loadLeadership(schoolSlug: string) {
    this.isLoading = true;
    this.error = null;

    try {
      // Fetch School Details
      const schoolsCol = collection(this.firestore, 'schools');
      const schoolQuery = query(schoolsCol, where('slug', '==', schoolSlug), limit(1));
      const schoolSnapshot = await getDocs(schoolQuery);

      if (schoolSnapshot.empty) {
        throw new Error(`School with slug "${schoolSlug}" not found.`);
      }

      const schoolDoc = schoolSnapshot.docs[0];
      this.schoolData = { id: schoolDoc.id, slug: schoolSlug, ...schoolDoc.data() } as School;

      // Fetch Approved Directors and Principals concurrently
      const [directorsSnapshot, principalsSnapshot] = await Promise.all([
        getDocs(query(collection(this.firestore, `schools/${this.schoolData.id}/directors`), where('status', '==', 'approved'))),
        getDocs(query(collection(this.firestore, `schools/${this.schoolData.id}/principals`), where('status', '==', 'approved')))
      ]);

      this.directors = directorsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data['name'] || 'No Name',
          photoURL: data['photoURL'] || '',
          email: data['email'] || '',
          message: data['message'] || '', 
          about_director: data['about_director'] || ''
        } as Director;
      });

      this.principals = principalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data['name'] || 'No Name',
          photoURL: data['photoURL'] || '',
          email: data['email'] || '',
          message: data['message'] || '',
          about_principal: data['about_principal'] || ''
        } as Principal;
      });

    } catch (err: any) {
      console.error('Error fetching leadership profiles:', err);
      this.error = err.message || 'An error occurred while fetching director profiles.';
    }

    this.isLoading = false;
    this.cdr.detectChanges();
  }
}