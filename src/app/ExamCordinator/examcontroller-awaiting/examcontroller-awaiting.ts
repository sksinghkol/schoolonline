import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { SchoolStateService } from '../../core/services/school-state.service';

@Component({
  selector: 'app-examcontroller-awaiting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './examcontroller-awaiting.html',
  styleUrl: './examcontroller-awaiting.scss'
})
export class ExamcontrollerAwaiting implements OnInit {
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
      const examcontrollerId = params.get('examcontrollerId');
      this.schoolId = params.get('schoolId');
      const schoolId = this.schoolId;
      if (!examcontrollerId || !schoolId) {
        this.loading.set(false);
        return;
      }
      try {
        const ref = doc(this.firestore, `schools/${schoolId}/examcontrollers/${examcontrollerId}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          this.name.set(data?.name || null);
          this.email.set(data?.email || null);
        }

        const schoolRef = doc(this.firestore, `schools/${schoolId}`);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          const s = schoolSnap.data() as any;
          const slug = s?.slug as string | undefined;
          this.schoolCodeOrSlug.set(slug || s?.code || s?.name?.replace(/\s+/g, '').toLowerCase() || null);
          this.schoolName.set(s?.name || null);
          this.schoolLogoUrl.set((s?.logoUrl || s?.logo || null) as string | null);
          this.schoolAddress.set((s?.address || null) as string | null);
          const contact = [s?.phone, s?.contact, s?.email].filter(Boolean).join(' | ');
          this.schoolContact.set(contact || null);
          this.schoolState.setCurrentSchool({ id: schoolId, ...s });
        }
      } finally {
        this.loading.set(false);
      }
    });
  }

  goToSchoolDashboard() {
    const slug = this.schoolCodeOrSlug();
    this.router.navigate(slug ? [`/SchoolDashboard/${slug}`] : ['/']);
  }
}