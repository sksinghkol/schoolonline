import { Injectable, signal, inject } from '@angular/core';
import { Firestore, doc, getDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SchoolStateService {
  private firestore = inject(Firestore);

  private schoolIdSource = new BehaviorSubject<string | null>(null);
  schoolId$ = this.schoolIdSource.asObservable();

  currentSchool = signal<any | null>(null);

  constructor() { }

  setCurrentSchool(school: any | null) {
    this.currentSchool.set(school);
  }

  setSchoolId(schoolId: string | null) {
    if (schoolId !== this.schoolIdSource.getValue()) {
      this.schoolIdSource.next(schoolId);
      if (schoolId) {
        this.setSchoolById(schoolId);
      } else {
        this.currentSchool.set(null);
      }
    }
  }

  async setSchoolById(id: string): Promise<void> {
    const schoolDocRef = doc(this.firestore, `schools/${id}`);
    const schoolSnap = await getDoc(schoolDocRef);
    if (schoolSnap.exists()) {
      this.currentSchool.set({ id: schoolSnap.id, ...schoolSnap.data() });
    }
  }

  async setSchoolBySlug(slug: string): Promise<void> {
    const schoolsCollection = collection(this.firestore, 'schools');
    const q = query(schoolsCollection, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const schoolDoc = querySnapshot.docs[0];
      this.currentSchool.set({ id: schoolDoc.id, ...schoolDoc.data() });
      this.setSchoolId(schoolDoc.id);
    }
  }
}