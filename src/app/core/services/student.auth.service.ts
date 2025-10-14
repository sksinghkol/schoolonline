import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, deleteUser } from '@angular/fire/auth';
import { User } from 'firebase/auth';

export interface AppUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'teacher' | 'principal' | 'director' | 'admin' | 'super-admin';
  schoolId?: string;
  class?: string;
  section?: string;
  roll?: string;
  mobile?: string;
  status?: 'active' | 'inactive';
  uid?: string;
}

@Injectable({ providedIn: 'root' })
export class StudentAuthService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  getUsers(role?: string) {
    const usersRef = collection(this.firestore, 'appusers');
    if (!role) return collectionData(usersRef, { idField: 'id' });

    const q = query(usersRef, where('role', '==', role));
    return collectionData(q, { idField: 'id' });
  }

  async addUser(user: AppUser) {
    try {
      if (!user.password) user.password = '123456';
      const userCredential = await createUserWithEmailAndPassword(this.auth, user.email, user.password);
      const uid = userCredential.user.uid;

      const usersRef = collection(this.firestore, 'appusers');
      await addDoc(usersRef, { ...user, uid, createdAt: new Date() });
      return { success: true };
    } catch (error) { return { success: false, error }; }
  }

  async updateUser(userId: string, updatedData: Partial<AppUser>) {
    try {
      const userDoc = doc(this.firestore, `appusers/${userId}`);
      await updateDoc(userDoc, { ...updatedData, updatedAt: new Date() });
      return { success: true };
    } catch (error) { return { success: false, error }; }
  }

  async deleteUser(userId: string, firebaseUid?: string) {
    try {
      const userDoc = doc(this.firestore, `appusers/${userId}`);
      await deleteDoc(userDoc);
      if (firebaseUid) {
        const user = this.auth.currentUser;
        if (user && user.uid === firebaseUid) await deleteUser(user);
      }
      return { success: true };
    } catch (error) { return { success: false, error }; }
  }
}
