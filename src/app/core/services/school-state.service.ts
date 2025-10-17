import { Injectable, signal, inject, runInInjectionContext, Injector } from '@angular/core';
import { collection, collectionData, doc, Firestore, getDoc, query, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SchoolStateService {
  private firestore: Firestore = inject(Firestore);
  private injector: Injector = inject(Injector);

  currentSchool = signal<any>(null);

  setSchoolBySlug(slug: string): void {
    runInInjectionContext(this.injector, () => {
      const schoolsCollection = collection(this.firestore, 'schools');
      // Normalize incoming slug to match how we generate and store it (lowercase, no spaces)
      const normalizedSlug = (slug || '').replace(/\s+/g, '').toLowerCase();
      const q = query(schoolsCollection, where('slug', '==', normalizedSlug));

      collectionData(q, { idField: 'id' }).pipe(take(1)).subscribe(schools => {
        if (schools.length > 0) {
          this.currentSchool.set(schools[0]);
        } else {
          this.currentSchool.set(null);
        }
      });
    });
  }

  async setSchoolById(id: string): Promise<void> {
    if (!id) return;
    const schoolRef = doc(this.firestore, 'schools', id);
    const snap = await getDoc(schoolRef);
    if (snap.exists()) {
      const data = snap.data();
      this.currentSchool.set({ id, ...data });
    } else {
      this.currentSchool.set(null);
    }
  }

  setCurrentSchool(school: any): void {
    this.currentSchool.set(school || null);
  }
}