import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Firestore, collection, getDocs, orderBy, query, doc, getDoc, writeBatch, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';

export interface LoginRecord {
  id?: string;
  loginAt?: any; // Firestore Timestamp or Date
  email?: string | null;
  displayName?: string | null;
  ipAddress?: string | null;
  photoURL?: string | null;
  adminId?: string | null;
  adminPath?: string | null;
  geoInfo?: { city?: string; region?: string; country?: string; [key: string]: any };
  deviceInfo?: { browser?: string; os?: string; type?: string; ua?: string };
  raw?: any;
  showDetails?: boolean;
}

export interface GroupedUser {
  key: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  records: LoginRecord[];
  expanded?: boolean;
  showDateRange?: boolean;
  startDate?: string;
  endDate?: string;
}

@Component({
  standalone: true,
  selector: 'app-all-admin-login',
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './all-admin-login.html',
  styleUrls: ['./all-admin-login.scss']
})
export class AllAdminLogin implements OnInit {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly cdr = inject(ChangeDetectorRef);

  allRecords: LoginRecord[] = [];
  groupedUsers: GroupedUser[] = [];

  private allRecordsMaster: LoginRecord[] = [];
  private groupedUsersMaster: GroupedUser[] = [];

  loading = true;
  errorMessage: string | null = null;
  viewMode: 'group' | 'flat' = 'group';

  private querySubject = new BehaviorSubject<string>('');
  query: string = '';

  async ngOnInit(): Promise<void> {
    await this.checkRoleAndLoad();
  }

  private async getCurrentUid(): Promise<string | null> {
    try {
      const cu = (this.auth as any).currentUser as any;
      if (cu && cu.uid) return cu.uid;
    } catch {}
    return new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(this.auth, u => {
        try { unsubscribe(); } catch {}
        resolve(u ? u.uid : null);
      });
      setTimeout(() => { try { unsubscribe(); } catch {}; resolve(null); }, 5000);
    });
  }

  async checkRoleAndLoad(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;
    const uid = await this.getCurrentUid();
    if (!uid) {
      this.loading = false;
      this.errorMessage = 'Not signed in. Please sign in as a super-admin.';
      return;
    }

    try {
      const adminRef = doc(this.firestore, `admin/${uid}`);
      const snapshot = await getDoc(adminRef);
      const data = snapshot.exists() ? snapshot.data() as any : null;
      const role = data?.role || null;

      if (role !== 'super-admin') {
        this.loading = false;
        this.errorMessage = 'Permission Denied. Only super-admin can view records.';
        return;
      }

      await this.loadAllLoginRecords();
    } catch (err: any) {
      console.error('Error checking role:', err);
      this.errorMessage = `Failed to verify admin role: ${err?.message || err}`;
      this.loading = false;
    }
    try { this.cdr.detectChanges(); } catch {}
  }

  async loadAllLoginRecords(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;
    this.allRecords = [];

    try {
      const recordsRef = collection(this.firestore, 'login_history');
      const q = query(recordsRef, orderBy('loginAt', 'desc'));
      const recordsSnap = await getDocs(q) as any;

      if (!recordsSnap || recordsSnap.empty) {
        this.allRecords = [];
        this.groupedUsers = [];
        return;
      }

      this.allRecords = recordsSnap.docs.map((doc: any) => {
        // ... (rest of the mapping logic is correct)
        const raw = doc.data();
        const adminId = raw?.uid || raw?.adminId || doc.ref?.parent?.parent?.id || null;
        const adminPath = raw?.adminPath || doc.ref?.parent?.parent?.path || null;
        const geoInfo = raw.geoInfo ? JSON.parse(JSON.stringify(raw.geoInfo)) : {};
        const deviceInfo = raw.deviceInfo ? JSON.parse(JSON.stringify(raw.deviceInfo)) : {};

        return {
          id: doc.id,
          displayName: raw.displayName || raw.email || 'Unknown User',
          email: raw.email || null,
          photoURL: this.normalizePhotoUrl(raw.photoURL),
          ipAddress: raw.ipAddress || 'Unknown',
          loginAt: raw.loginAt,
          adminId,
          adminPath,
          geoInfo: { city: geoInfo.city || '—', region: geoInfo.region || '—', country: geoInfo.country || '—' },
          deviceInfo: { browser: deviceInfo.browser || '—', os: deviceInfo.os || '—', type: deviceInfo.type || '—', ua: deviceInfo.ua || '' },
          raw,
          showDetails: false,
        } as LoginRecord;
      });

      this.allRecordsMaster = [...this.allRecords];
      this.groupRecordsByUser();
      this.setupFiltering();
      try { this.cdr.detectChanges(); } catch {}
    } catch (err: any) {
      console.error('Error loading login records:', err);
      this.errorMessage = err.code === 'permission-denied'
        ? 'Permission Denied. You might not have required access rights.'
        : `Failed to load records: ${err.message}`;
    } finally {
      this.loading = false;
      try { this.cdr.detectChanges(); } catch {}
    }
  }

  private groupRecordsByUser() {
    const map = new Map<string, GroupedUser>();
    for (const rec of this.allRecords) {
      const key = rec.adminId || rec.adminPath || rec.email || rec.displayName || rec.id || 'unknown';
      if (!map.has(key)) {
        map.set(key, { key, email: rec.email, displayName: rec.displayName, photoURL: rec.photoURL, records: [], expanded: false });
      }
      map.get(key)!.records.push(rec);
    }

    const users = Array.from(map.values()).map(u => {
      u.records.sort((a, b) => {
        const ta = a.loginAt?.toDate ? a.loginAt.toDate().getTime() : (a.loginAt ? new Date(a.loginAt).getTime() : 0);
        const tb = b.loginAt?.toDate ? b.loginAt.toDate().getTime() : (b.loginAt ? new Date(b.loginAt).getTime() : 0);
        return tb - ta;
      });
      return u;
    });

    users.sort((a, b) => b.records.length - a.records.length || (a.displayName || '').localeCompare(b.displayName || ''));
    this.groupedUsersMaster = users;
    this.groupedUsers = [...this.groupedUsersMaster];
  }

  private setupFiltering(): void {
    this.querySubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      startWith('')
    ).subscribe(query => {
      this.query = query;
      this.filterData(query);
    });
  }

  onQueryChange(value: string): void {
    this.querySubject.next(value);
  }

  private filterData(query: string): void {
    const lowerCaseQuery = query.toLowerCase().trim();
    if (!lowerCaseQuery) {
      this.allRecords = [...this.allRecordsMaster];
      this.groupedUsers = [...this.groupedUsersMaster];
    } else {
      this.allRecords = this.allRecordsMaster.filter(rec =>
        rec.displayName?.toLowerCase().includes(lowerCaseQuery) ||
        rec.email?.toLowerCase().includes(lowerCaseQuery)
      );
      this.groupedUsers = this.groupedUsersMaster.filter(user =>
        user.displayName?.toLowerCase().includes(lowerCaseQuery) ||
        user.email?.toLowerCase().includes(lowerCaseQuery)
      );
    }
    this.cdr.detectChanges();
  }

  trackById(_i: number, item: LoginRecord) { return item.id; }
  trackByUser(_i: number, item: GroupedUser) { return item.key; }
  toggleView() {
    this.viewMode = this.viewMode === 'group' ? 'flat' : 'group';
  }
  toggleUser(user: GroupedUser) { user.expanded = !user.expanded; try { this.cdr.detectChanges(); } catch {} }
  toggleRecordDetails(rec: LoginRecord) { rec.showDetails = !rec.showDetails; try { this.cdr.detectChanges(); } catch {} }

  onImgError(evt: Event) {
    const img = evt.target as HTMLImageElement;
    if (img) { img.onerror = null; img.src = 'https://www.gravatar.com/avatar/?d=mp'; }
  }

  private normalizePhotoUrl(url: string | null | undefined): string {
    const defaultAvatar = 'https://www.gravatar.com/avatar/?d=mp';
    if (!url) return defaultAvatar;

    try {
      let rawUrl = url.toString().trim();
      if (rawUrl.startsWith('//')) {
        rawUrl = 'https:' + rawUrl;
      }
      const u = new URL(rawUrl);
      if (u.hostname.includes('googleusercontent.com')) {
        // Standardize Google photo URLs to a consistent size
        u.pathname = u.pathname.replace(/\/s\d+(-c)?\//, '/s128-c/');
      }
      return u.toString();
    } catch { return defaultAvatar; }
  }

  // ==========================
  // 🔹 Delete All History
  // ==========================
  async deleteUserHistory(user: GroupedUser) {
    const adminId = user.key;
    if (!adminId || adminId === 'unknown') { this.errorMessage = 'Cannot delete history for unknown user.'; return; }
    if (!confirm(`Delete all ${user.records.length} records for this user? This cannot be undone.`)) return;

    this.loading = true;
    this.errorMessage = null;

    try {
      const adminDocRef = doc(this.firestore, `admin/${(this.auth.currentUser)?.uid}`);
      const adminSnapshot = await getDoc(adminDocRef);
      const adminData = adminSnapshot.exists() ? adminSnapshot.data() : null;
      if (!adminData || adminData['role'] !== 'super-admin') throw new Error('Permission denied. Only super-admin can delete login history.');

      const batch = writeBatch(this.firestore);
      user.records.forEach(r => { if (r.id) batch.delete(doc(this.firestore, `login_history/${r.id}`)); });
      const userSubRef = collection(this.firestore, `admin/${adminId}/login_records`);
      const userSnap = await getDocs(userSubRef);
      userSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();

      this.allRecords = this.allRecords.filter(r => r.adminId !== adminId);
      this.groupRecordsByUser();

    } catch (err: any) {
      console.error('Error deleting user history:', err);
      this.errorMessage = err.message || 'Failed to delete user history.';
    } finally {
      this.loading = false;
      try { this.cdr.detectChanges(); } catch {}
    }
  }

  // ==========================
  // 🔹 Delete by Date Range
  // ==========================
  async deleteUserHistoryByDateRange(user: GroupedUser) {
    const adminId = user.key;
    if (!adminId || !user.startDate || !user.endDate) {
      this.errorMessage = 'Please select valid date range.';
      return;
    }

    const start = new Date(user.startDate);
    const end = new Date(user.endDate); end.setHours(23,59,59,999);
    if (start > end) { this.errorMessage = 'Start date cannot be after end date.'; return; }

    if (!confirm(`Delete login records between ${start.toLocaleDateString()} and ${end.toLocaleDateString()}?`)) return;

    this.loading = true;
    this.errorMessage = null;

    try {
      const adminDocRef = doc(this.firestore, `admin/${(this.auth.currentUser)?.uid}`);
      const adminSnapshot = await getDoc(adminDocRef);
      const adminData = adminSnapshot.exists() ? adminSnapshot.data() : null;
      if (!adminData || adminData['role'] !== 'super-admin') throw new Error('Permission denied. Only super-admin can delete login history.');

      const batch = writeBatch(this.firestore);

      const loginHistoryRef = collection(this.firestore, 'login_history');
      const qGlobal = query(loginHistoryRef, where('uid','==',adminId), where('loginAt','>=',start), where('loginAt','<=',end));
      const snapGlobal = await getDocs(qGlobal);
      snapGlobal.forEach(d => batch.delete(d.ref));

      const userSubRef = collection(this.firestore, `admin/${adminId}/login_records`);
      const qUser = query(userSubRef, where('loginAt','>=',start), where('loginAt','<=',end));
      const snapUser = await getDocs(qUser);
      snapUser.forEach(d => batch.delete(d.ref));

      await batch.commit();

      const deletedIds = new Set(snapGlobal.docs.map(d => d.id));
      this.allRecords = this.allRecords.filter(r => !deletedIds.has(r.id || ''));
      this.groupRecordsByUser();
      user.showDateRange = false;

    } catch (err: any) {
      console.error('Error deleting history by date range:', err);
      this.errorMessage = err.message || 'Failed to delete login history by date range.';
    } finally {
      this.loading = false;
      try { this.cdr.detectChanges(); } catch {}
    }
  }

  async deleteAdminUser(user: GroupedUser) {
    const adminId = user.key;
    if (!adminId || adminId === 'unknown') {
      this.errorMessage = 'Cannot delete a user with an unknown ID.';
      return;
    }

    const confirmation = prompt(`This will permanently delete the user '${user.displayName || adminId}' and all their login history. This action cannot be undone. Please type 'DELETE' to confirm.`);
    if (confirmation !== 'DELETE') {
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    try {
      // First, delete all login history for the user
      await this.deleteUserHistory(user);

      // Then, delete the admin document itself
      const adminDocRef = doc(this.firestore, `admin/${adminId}`);
      const batch = writeBatch(this.firestore);
      batch.delete(adminDocRef);
      await batch.commit();

      // Remove user from the UI
      this.groupedUsers = this.groupedUsers.filter(u => u.key !== adminId);

      // Note: This does NOT delete the user from Firebase Authentication.
      // That requires admin privileges and is best handled by a backend Cloud Function
      // for security reasons. You would call that function here.

    } catch (err: any) {
      console.error('Error deleting admin user:', err);
      this.errorMessage = `Failed to delete user: ${err.message}`;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
