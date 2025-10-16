import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, User } from '@angular/fire/auth';
import { BehaviorSubject, from } from 'rxjs';

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
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private firestore: Firestore, private auth: Auth) {
    // Persist user login across refresh
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const appUser = await this.fetchAppUserByUid(user.uid);
        this.currentUserSubject.next(appUser);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  async fetchAppUserByUid(uid: string): Promise<AppUser | null> {
    const q = query(collection(this.firestore, 'appusers'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data() as AppUser;
      return { id: querySnapshot.docs[0].id, ...docData };
    }
    return null;
  }

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

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;
      const appUser = await this.fetchAppUserByUid(firebaseUser.uid);
      if (!appUser) throw new Error('No user record found in Firestore.');
      this.currentUserSubject.next(appUser);
      return { success: true, user: appUser };
    } catch (error) {
      return { success: false, error };
    }
  }

  async logout() {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
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
