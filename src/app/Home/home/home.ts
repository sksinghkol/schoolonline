import { Component, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Router, RouterOutlet, RouterModule, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { HomeMenu } from '../../Navbar/home-menu/home-menu';

interface School {
  id: string;
  name: string;
  slug?: string;
  logoUrl: string;
  city: string;
  address: string;
  curriculum_type: string;
  ownership_type: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, HomeMenu, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home {
  private firestore = inject(Firestore);
  private router = inject(Router);

  schools$!: Observable<School[]>;

  constructor() {
    const colRef = collection(this.firestore, 'schools');
    this.schools$ = collectionData(colRef, { idField: 'id' }) as Observable<School[]>;
  }

  // Navigate to selected school's public page using a slug.
  // Preferred slug: use stored `school.slug` if present, otherwise generate a concatenated Proper-case slug
  generateSlug(name: string): string {
    const words = (name || '').replace(/[^A-Za-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    return words.join('').toLowerCase();
  }

  goToSchoolDashboard(school: School) {
    const slug = (school as any).slug || this.generateSlug(school.name || '');
    // navigate to SchoolDashboard/:schoolName so the nested SchoolHome component receives the param
    const path = ['/SchoolDashboard', slug];
    console.debug('Home: navigating to', path);
    this.router.navigate(path).then(ok => {
      if (!ok) {
        console.warn('Home: router.navigate returned false, falling back to window.location');
        try { window.location.href = `/${slug}`; } catch (e) { console.error(e); }
      }
    }).catch(err => {
      console.error('Home: router.navigate failed, falling back to window.location', err);
      try { window.location.href = `/${slug}`; } catch (e) { console.error(e); }
    });
  }
}