// src/app/core/services/school.service.ts
import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SchoolService {
  constructor(private firestore: Firestore) {}

  async addSchool(data: any) {
    const schoolRef = doc(this.firestore, `schools/${data.code}`);
    await setDoc(schoolRef, {
      ...data,
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
