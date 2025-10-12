import { Component } from '@angular/core';
import { CommonModule, NgIf, NgForOf, AsyncPipe, DatePipe } from '@angular/common';
import { OnInit, inject } from '@angular/core';
import { Firestore, collectionData, query, orderBy, limit, collectionGroup } from '@angular/fire/firestore';
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
  templateUrl: './all-login.html',
  styleUrls: ['./all-login.scss']
})
export class AllLogin implements OnInit {
  private firestore = inject(Firestore);

  loginRecords$!: Observable<LoginRecord[]>;

  ngOnInit(): void {
    this.initQuery();
  }

  private initQuery() {
    const colGroup = collectionGroup(this.firestore, 'login_records');
    const q = query(colGroup, orderBy('loginAt', 'desc'), limit(100));
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
}