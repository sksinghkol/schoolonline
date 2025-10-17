import { Component, inject, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  collectionData,
  limit,
} from '@angular/fire/firestore';
import { combineLatest, Observable, of, BehaviorSubject, Subscription, from } from 'rxjs';
import { map, startWith, switchMap, catchError, filter, finalize, tap, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-history.html',
  styleUrls: ['./student-history.scss'],
})
export class StudentHistory implements OnInit, OnDestroy {
  private firestore: Firestore = inject(Firestore);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private sub = new Subscription();
  private dataSub: Subscription | null = null;

  loginRecords$: Observable<any[]> = of([]);
  filteredRecords$: Observable<any[]> = of([]);

  // Filter properties
  studentNameFilter$ = new BehaviorSubject<string>('');
  schoolNameFilter$ = new BehaviorSubject<string>('');

  loading = true;
  errorMessage: string | null = null;

  ngOnInit() {
    // Reset previous subscriptions in case the component is reused without destroy
    try { this.sub.unsubscribe(); } catch {}
    this.sub = new Subscription();
    // Reset state to avoid stale filters/data on re-entry
    this.zone.run(() => {
      this.loading = true;
      this.errorMessage = null;
      this.cdr.markForCheck();
    });
    this.studentNameFilter$.next('');
    this.schoolNameFilter$.next('');
    this.loadLoginHistory();
    // Ensure streams start so loading/error states update even while the template shows the spinner
    // Subscribe to filteredRecords$ (downstream) so the entire pipeline is active
    try { this.dataSub?.unsubscribe(); } catch {}
    this.dataSub = this.filteredRecords$.subscribe();

    // If the router reuses the component instance, re-init on navigation back to this URL
    this.sub.add(
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd)
        )
        .subscribe(e => {
          if (e.urlAfterRedirects?.includes('/admin-dashboard/loginHistory/students')) {
            this.zone.run(() => {
              this.loading = true;
              this.errorMessage = null;
              this.cdr.markForCheck();
            });
            this.studentNameFilter$.next('');
            this.schoolNameFilter$.next('');
            this.loadLoginHistory();
            // Re-subscribe to the newly assigned streams
            try { this.dataSub?.unsubscribe(); } catch {}
            this.dataSub = this.filteredRecords$.subscribe();
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    try { this.dataSub?.unsubscribe(); } catch {}
  }

  loadLoginHistory() {
    const historyQuery = query(
      collection(this.firestore, 'login_history'),
      orderBy('loginAt', 'desc'),
      limit(100) // Limit to a reasonable number for performance
    );

    this.loginRecords$ = (
      collectionData(historyQuery, { idField: 'id' }) as Observable<any[]>
    ).pipe(
      // Emit once immediately so the UI can render and spinner can clear even if Firestore takes time
      startWith([] as any[]),
      // Turn off loading on first emission from the source collection regardless of length
      tap(() => {
        this.zone.run(() => { this.loading = false; this.cdr.markForCheck(); });
      }),
      switchMap(records => {
        // Filter out records with missing IDs to prevent errors
        const validRecords = records.filter(r => r.studentId && r.schoolId);

        const userObservables = validRecords.map(record =>
          this.getUserAndSchool(record.studentId, record.schoolId).pipe(
            map(details => ({ ...record, ...details })),
            catchError(() => of({ ...record, studentName: 'Error', schoolName: 'Error', photoURL: 'https://www.gravatar.com/avatar/?d=mp' }))
          )
        );

        return userObservables.length > 0 ? combineLatest(userObservables) : of([]);
      }),
      map(enrichedRecords => {
        this.zone.run(() => { this.loading = false; this.cdr.markForCheck(); });
        return enrichedRecords;
      }),
      // Move catchError into the main pipeline
      catchError(err => {
        this.zone.run(() => {
          this.errorMessage = 'Failed to load login history.';
          this.loading = false;
          this.cdr.markForCheck();
        });
        return of([]);
      }),
      finalize(() => {
        // This will always run, ensuring the loading spinner is hidden.
        this.zone.run(() => { this.loading = false; });
      }),
      // Share the latest value so multiple subscribers (component + template) don't duplicate work
      shareReplay(1)
    );

    this.filteredRecords$ = combineLatest([
      this.loginRecords$,
      this.studentNameFilter$,
      this.schoolNameFilter$
    ]).pipe(
      map(([records, studentName, schoolName]) => this.filterRecords(records, studentName, schoolName)),
      // Share to avoid multiple recomputations and stabilize across view re-subscriptions
      shareReplay(1)
    );
  }

  private getUserAndSchool(studentId: string, schoolId: string): Observable<{ studentName: string; schoolName: string; photoURL: string; studentClass: string; rollNo: string; }> {
    const studentDocRef = doc(this.firestore, `schools/${schoolId}/students/${studentId}`);
    const schoolDocRef = doc(this.firestore, `schools/${schoolId}`);

    // Wrap Promises from getDoc into Observables so combineLatest will emit
    return combineLatest([from(getDoc(studentDocRef)), from(getDoc(schoolDocRef))]).pipe(
      map(([studentSnap, schoolSnap]) => {
        const studentData = studentSnap.data();
        return {
          studentName: studentData?.['name'] || 'Unknown Student',
          schoolName: schoolSnap.data()?.['name'] || 'Unknown School',
          photoURL: studentData?.['photoURL'] || 'https://www.gravatar.com/avatar/?d=mp',
          studentClass: studentData?.['class'] || 'N/A',
          rollNo: studentData?.['roll_no'] || 'N/A'
        };
      })
    );
  }

  filterRecords(records: any[], studentName: string, schoolName: string): any[] {
    const studentFilter = studentName.toLowerCase();
    const schoolFilter = schoolName.toLowerCase();

    return records.filter(record => {
      const studentMatch = record.studentName?.toLowerCase().includes(studentFilter) ?? true;
      const schoolMatch = record.schoolName?.toLowerCase().includes(schoolFilter);
      return studentMatch && schoolMatch;
    });
  }
}