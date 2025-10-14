import { Injectable, signal } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SchoolStateService {
  currentSchool = signal<any>(null);

  constructor(private firestore: Firestore) {}

  // ✅ Add this method
  setSchoolBySlug(slug: string) {
    const schoolsRef = collection(this.firestore, 'schools');
    collectionData(schoolsRef, { idField: 'id' }).subscribe((schools: any) => {
      const school = schools.find((s: any) => s.slug === slug);
      this.currentSchool.set(school || null);
    });
  }
}
