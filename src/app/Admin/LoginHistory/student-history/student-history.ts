import { Component, inject, OnInit } from '@angular/core';
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
import { combineLatest, Observable, of, BehaviorSubject } from 'rxjs';
import { map, startWith, switchMap, catchError, filter } from 'rxjs/operators';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-history.html',
  styleUrls: ['./student-history.scss'],
})
export class StudentHistory implements OnInit {
  private firestore: Firestore = inject(Firestore);

  loginRecords$: Observable<any[]> = of([]);
  filteredRecords$: Observable<any[]> = of([]);

  // Filter properties
  studentNameFilter$ = new BehaviorSubject<string>('');
  schoolNameFilter$ = new BehaviorSubject<string>('');

  loading = true;
  errorMessage: string | null = null;

  ngOnInit() {
    this.loadLoginHistory();
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
      switchMap(records => {
        // Filter out records with missing IDs to prevent errors
        const validRecords = records.filter(r => r.studentId && r.schoolId);

        if (records.length === 0) {
          this.loading = false;
          return of([]);
        }
        const userObservables = validRecords.map(record =>
          this.getUserAndSchool(record.studentId, record.schoolId).pipe(
            map(details => ({ ...record, ...details })),
            catchError(() => of({ ...record, studentName: 'Error', schoolName: 'Error', photoURL: 'https://www.gravatar.com/avatar/?d=mp' }))
          )
        );
        if (userObservables.length === 0) {
          this.loading = false;
          return of([]);
        }
        return combineLatest(userObservables);
      }),
      map(enrichedRecords => {
        this.loading = false;
        return enrichedRecords;
      })
    );

    // Add a catchError to the main observable to handle any failures
    this.loginRecords$.pipe(catchError(err => {
      this.errorMessage = 'Failed to load login history.';
      this.loading = false;
      return of([]);
    })).subscribe();

    this.filteredRecords$ = combineLatest([
      this.loginRecords$,
      this.studentNameFilter$,
      this.schoolNameFilter$
    ]).pipe(
      map(([records, studentName, schoolName]) => this.filterRecords(records, studentName, schoolName))
    );
  }

  private getUserAndSchool(studentId: string, schoolId: string): Observable<{ studentName: string; schoolName: string; photoURL: string; studentClass: string; rollNo: string; }> {
    const studentDocRef = doc(this.firestore, `schools/${schoolId}/students/${studentId}`);
    const schoolDocRef = doc(this.firestore, `schools/${schoolId}`);

    return combineLatest([getDoc(studentDocRef), getDoc(schoolDocRef)]).pipe(
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