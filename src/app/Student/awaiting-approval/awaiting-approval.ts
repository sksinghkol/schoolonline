import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-awaiting-approval',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="padding:2rem; max-width: 720px; margin: 0 auto; text-align:center;">
      <ng-container *ngIf="loading(); else loaded">
        <h2>Loading...</h2>
      </ng-container>
      <ng-template #loaded>
        <div *ngIf="schoolName() as sn" style="margin-bottom:1rem;">
          <div *ngIf="schoolLogoUrl()" style="margin-bottom:0.5rem;">
            <img [src]="schoolLogoUrl()!" [alt]="sn" style="max-height:70px; object-fit:contain;" />
          </div>
          <h3 style="margin: 0 0 0.25rem 0;">{{ sn }}</h3>
          <div *ngIf="schoolAddress()" style="color:#6b7280;">{{ schoolAddress() }}</div>
          <div *ngIf="schoolContact()" style="color:#6b7280;">{{ schoolContact() }}</div>
        </div>
        <h2>Dear {{ name() || 'Student' }}</h2>
        <p>Your account is awaiting approval.</p>
        <p>Please contact your school administrator. You will be able to access the dashboard once approved.</p>

        <div *ngIf="email()" style="margin-top:1rem; color:#6b7280;">Email: {{ email() }}</div>

        <div style="margin-top:2rem;">
          <button (click)="goToSchoolDashboard()" style="padding:0.6rem 1.2rem; background:#2563eb; color:#fff; border:none; border-radius:6px; cursor:pointer;">
            OK
          </button>
        </div>
      </ng-template>
    </div>
  `,
})
export class AwaitingApproval implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private router = inject(Router);

  loading = signal(true);
  name = signal<string | null>(null);
  email = signal<string | null>(null);
  schoolCodeOrSlug = signal<string | null>(null);
  schoolId: string | null = null;
  schoolName = signal<string | null>(null);
  schoolLogoUrl = signal<string | null>(null);
  schoolAddress = signal<string | null>(null);
  schoolContact = signal<string | null>(null);

  async ngOnInit() {
    this.route.queryParamMap.subscribe(async (params) => {
      const studentId = params.get('studentId');
      this.schoolId = params.get('schoolId');
      const schoolId = this.schoolId;
      if (!studentId || !schoolId) {
        this.loading.set(false);
        return;
      }
      try {
        const ref = doc(this.firestore, `schools/${schoolId}/students/${studentId}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          this.name.set(data?.name || null);
          this.email.set(data?.email || null);
        }

        // Load school doc to get code/slug
        const schoolRef = doc(this.firestore, `schools/${schoolId}`);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          const s = schoolSnap.data() as any;
          // Prefer code (as used in examples), otherwise slug, otherwise name normalized
          const code = s?.code as string | undefined;
          const slug = s?.slug as string | undefined;
          const name = s?.name as string | undefined;
          const normalizedName = name ? name.replace(/\s+/g, '').toUpperCase() : null;
          this.schoolCodeOrSlug.set(code || slug || normalizedName || null);

          // School display fields (optional)
          this.schoolName.set(name || code || slug || null);
          this.schoolLogoUrl.set((s?.logoUrl || s?.logo || null) as string | null);
          this.schoolAddress.set((s?.address || null) as string | null);
          // Combine phone/email if present for a simple contact line
          const contact = [s?.phone, s?.contact, s?.email].filter(Boolean).join(' | ');
          this.schoolContact.set(contact || null);
        }
      } finally {
        this.loading.set(false);
      }
    });
  }

  goToSchoolDashboard() {
    const v = this.schoolCodeOrSlug();
    if (v) {
      this.router.navigate([`/SchoolDashboard/${v}`]);
    } else if (this.schoolId) {
      // Fallback: if no code/slug, try using schoolId
      this.router.navigate([`/SchoolDashboard/${this.schoolId}`]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
