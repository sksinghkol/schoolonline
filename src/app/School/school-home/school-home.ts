import { Component, OnInit, inject, ChangeDetectorRef, Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { SchoolStateService } from '../../core/services/school-state.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-school-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './school-home.html',
  styleUrls: ['./school-home.scss']
})
export class SchoolHome implements OnInit {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private schoolState = inject(SchoolStateService);
  private injector = inject(Injector);

  schoolData: any = null;
  loading = true;
  matchedVariant: string | null = null;
  incomingName: string | null = null;

  async ngOnInit() {
    const rawName = this.route.snapshot.paramMap.get('schoolName')
      || this.route.parent?.snapshot.paramMap.get('schoolName')
      || this.route.root?.snapshot.paramMap.get('schoolName')
      || '';

    const schoolSlug = rawName.trim().toLowerCase().replace(/\s+/g, '');
    this.incomingName = rawName;

    if (!schoolSlug) {
      this.schoolState.currentSchool.set(null);
      this.loading = false;
      return;
    }

    try {
      await this.loadSchoolBySlug(schoolSlug);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadSchoolBySlug(slug: string) {
    return runInInjectionContext(this.injector, async () => {
      const schoolsCol = collection(this.firestore, 'schools');
      
      // First try exact slug match
      let q = query(schoolsCol, where('slug', '==', slug), limit(1));
      let snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        this.schoolData = this.formatSchoolData(doc);
        this.schoolState.currentSchool.set(this.schoolData);
        this.matchedVariant = slug;
        console.log('SchoolHome: Found school:', this.schoolData);
        return;
      }

      // If no slug match, try exact code match using the original incoming value (not lowercased)
      const original = this.incomingName?.trim() || '';
      if (original) {
        q = query(schoolsCol, where('code', '==', original), limit(1));
        snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          this.schoolData = this.formatSchoolData(doc);
          this.schoolState.currentSchool.set(this.schoolData);
          this.matchedVariant = (this.schoolData as any).slug || original;
          console.log('SchoolHome: Found school by code:', this.schoolData);
          return;
        }
      }

      // If no exact match, try case-insensitive / closest variant match
      const allSnapshot = await getDocs(schoolsCol);
      let closest: any = null;
      let closestDiff = Infinity;
      allSnapshot.forEach(doc => {
        const data = doc.data();
        if (data['slug']) {
          const diff = this.stringDiff(slug, data['slug'].toLowerCase());
          if (diff < closestDiff) {
            closestDiff = diff;
            closest = { id: doc.id, ...data };
          }
        }
      });

      if (closest) {
        this.schoolData = closest;
        this.matchedVariant = closest.slug;
        this.schoolState.currentSchool.set(this.schoolData);
        console.warn(`SchoolHome: No exact match. Showing closest variant: ${closest.slug}`);
      } else {
        console.warn('SchoolHome: No school found at all for slug:', slug);
        this.schoolState.currentSchool.set(null);
      }
    });
  }

  private formatSchoolData(doc: any) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      subscription: data.subscription
        ? {
            ...data.subscription,
            startsAt: data.subscription.startsAt?.toDate ? data.subscription.startsAt.toDate() : data.subscription.startsAt,
            endsAt: data.subscription.endsAt?.toDate ? data.subscription.endsAt.toDate() : data.subscription.endsAt
          }
        : null
    };
  }

  // Simple string difference metric (Levenshtein distance)
  private stringDiff(a: string, b: string) {
    if (a === b) return 0;
    let matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
    return matrix[b.length][a.length];
  }
}
