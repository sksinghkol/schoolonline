import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-student-homepage',
  imports: [CommonModule],
  templateUrl: './student-homepage.html',
  styleUrl: './student-homepage.scss'
})
export class StudentHomepage implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);

  loading = signal(true);
  error = signal<string | null>(null);
  student: any = null;

  async ngOnInit() {
    this.route.queryParamMap.subscribe(async (params) => {
      const studentId = params.get('studentId');
      const schoolId = params.get('schoolId');
      if (!studentId || !schoolId) {
        this.error.set('Missing studentId or schoolId.');
        this.loading.set(false);
        return;
      }
      try {
        const ref = doc(this.firestore, `schools/${schoolId}/students/${studentId}`);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          this.error.set('Student record not found.');
        } else {
          this.student = { id: snap.id, ...snap.data() } as any;
        }
      } catch (e: any) {
        this.error.set(e.message || 'Failed to load student.');
      } finally {
        this.loading.set(false);
      }
    });
  }
}
