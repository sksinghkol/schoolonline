import { Component } from '@angular/core';
import { CommonModule, NgIf, NgForOf, AsyncPipe, DatePipe } from '@angular/common';
import { OnInit, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, collectionData, query, orderBy, limit } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface LoginRecord {
  id?: string;
  loginAt?: any; // Firestore Timestamp
  email?: string | null;
  displayName?: string | null;
  ipAddress?: string | null;
  photoURL?: string | null;
  geoInfo?: {
    country?: string;
    region?: string;
    city?: string;
  };
  deviceInfo?: {
    browser?: string;
    os?: string;
    type?: string;
    ua?: string;
  };
}

@Component({
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, AsyncPipe, DatePipe],
  templateUrl: './login-history.html',
  styleUrls: ['./login-history.scss']
})
export class LoginHistory implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  loginRecords$!: Observable<LoginRecord[]>;
  uid: string | null = null;
  currentPhotoURL: string | null = null;

  ngOnInit(): void {
    // Try current user first (already signed in)
    const current = this.auth.currentUser;
    if (current?.uid) {
      this.uid = current.uid;
      this.currentPhotoURL = this.pickBestPhotoUrl(current.photoURL, (current as any)?.providerData);
      this.initQuery(current.uid);
      return;
    }

    // Fallback: wait for auth state
    // NOTE: onAuthStateChanged is available on the Auth instance
    (this.auth as any).onAuthStateChanged?.((user: any) => {
      if (user?.uid && !this.uid) {
        this.uid = user.uid;
        this.currentPhotoURL = this.pickBestPhotoUrl(user.photoURL, user?.providerData);
        this.initQuery(user.uid);
      }
    });
  }

  private initQuery(uid: string) {
    const col = collection(this.firestore, `admin/${uid}/login_records`);
    const q = query(col, orderBy('loginAt', 'desc'), limit(50));
    this.loginRecords$ = collectionData(q, { idField: 'id' }) as Observable<LoginRecord[]>;
  }

  trackById(_i: number, item: LoginRecord) { return item.id; }

  onImgError(evt: Event) {
    const img = evt.target as HTMLImageElement | null;
    if (img) {
      try { console.warn('Avatar failed to load, src:', img.src); } catch {}
      img.onerror = null; // prevent infinite loop
      img.src = 'https://www.gravatar.com/avatar/?d=mp';
    }
  }

  private pickBestPhotoUrl(primary: string | null | undefined, providerData?: Array<{ photoURL?: string | null }>): string | null {
    const firstProviderUrl = providerData?.find(p => !!p?.photoURL)?.photoURL;
    const chosen = (primary || firstProviderUrl || null) as string | null;
    return this.normalizePhotoUrl(chosen);
  }

  private normalizePhotoUrl(url: string | null): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      // For Google profile images, ensure a reasonable size
      if (u.hostname.endsWith('googleusercontent.com') && !u.searchParams.has('sz')) {
        u.searchParams.set('sz', '128');
        return u.toString();
      }
    } catch {}
    return url;
  }
}
