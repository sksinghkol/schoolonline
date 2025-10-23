import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { SchoolStateService } from '../../core/services/school-state.service';

@Component({
  selector: 'app-transport-awaiting',
  imports: [CommonModule],
  templateUrl: './transport-awaiting.html',
  styleUrl: './transport-awaiting.scss'
})
export class TransportAwaiting implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private schoolState = inject(SchoolStateService);

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
      const transportId = params.get('transportId');
      this.schoolId = params.get('schoolId');
      const schoolId = this.schoolId;
      if (!transportId || !schoolId) {
        this.loading.set(false);
        return;
      }
      try {
        const ref = doc(this.firestore, `schools/${schoolId}/transports/${transportId}`);
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
          // Prefer slug for dashboard URL, then code, then normalized name (lowercase)
          const code = s?.code as string | undefined;
          const slug = s?.slug as string | undefined;
          const name = s?.name as string | undefined;
          const normalizedName = name ? name.replace(/\s+/g, '').toLowerCase() : null;
          this.schoolCodeOrSlug.set(slug || code || normalizedName || null);

          // School display fields (optional)
          this.schoolName.set(name || code || slug || null);
          this.schoolLogoUrl.set((s?.logoUrl || s?.logo || null) as string | null);
          this.schoolAddress.set((s?.address || null) as string | null);
          // Combine phone/email if present for a simple contact line
          const contact = [s?.phone, s?.contact, s?.email].filter(Boolean).join(' | ');
          this.schoolContact.set(contact || null);

          // Ensure global school state is set for menus to display correct name/logo
          this.schoolState.setCurrentSchool({ id: schoolId, ...s });
        }
      } finally {
        this.loading.set(false);
      }
    });
  }

  goToSchoolDashboard() {
    const v = this.schoolCodeOrSlug();
    if (v) {
      this.router.navigate([`/TransportDashboard/${v}`]);
    } else if (this.schoolId) {
      // Fallback: if no code/slug, try using schoolId
      this.router.navigate([`/TransportDashboard/${this.schoolId}`]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
