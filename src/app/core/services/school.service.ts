// src/app/core/services/school.service.ts
import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SchoolService {
  constructor(private firestore: Firestore) {}

  private generateSlug(name: string): string {
    const words = (name || '').replace(/[^A-Za-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    return words.join('').toLowerCase();
  }

  async addSchool(data: any) {
    const schoolRef = doc(this.firestore, `schools/${data.code}`);
    const slug = this.generateSlug(data.name);
    await setDoc(schoolRef, {
      ...data,
      slug: slug,
      createdAt: serverTimestamp(),
      status: 'active'
    });
  }

  async addSchoolAdminUser(schoolCode: string, adminUser: any) {
    const userRef = doc(this.firestore, `schools/${schoolCode}/users/${adminUser.uid}`);
    await setDoc(userRef, {
      ...adminUser,
      createdAt: serverTimestamp()
    });

    const topUserRef = doc(this.firestore, `users/${adminUser.uid}`);
    await setDoc(topUserRef, {
      schoolId: schoolCode,
      ...adminUser
    });
  }
}
