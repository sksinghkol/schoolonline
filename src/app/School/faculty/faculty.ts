import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Firestore, collection, getDocs, DocumentData, query, where, limit, orderBy } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';

// Define an interface for type safety
interface Teacher extends DocumentData {
  id: string;
  name: string;
  photoURL?: string;
  qualification?: string;
  subjects?: string[];
  bio?: string;
}

@Component({
  selector: 'app-faculty',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faculty.html',
  styleUrls: ['./faculty.scss']
})
export class FacultyComponent implements OnInit {
  teachers: Teacher[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private firestore: Firestore,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(async (params) => {
      const schoolSlug = params.get('schoolName');
      if (schoolSlug) {
        await this.loadFaculty(schoolSlug);
      } else {
        this.error = 'School identifier not found in URL.';
        this.isLoading = false;
      }
    });
  }

  async loadFaculty(schoolSlug: string) {
    this.error = null;
    this.isLoading = true;

    try {
      // 1. Find the school document by its slug to get the actual document ID
      const schoolsCollection = collection(this.firestore, 'schools');
      const schoolQuery = query(schoolsCollection, where('slug', '==', schoolSlug), limit(1));
      const schoolQuerySnapshot = await getDocs(schoolQuery);

      if (schoolQuerySnapshot.empty) {
        this.error = `No school found with the identifier '${schoolSlug}'.`;
        this.isLoading = false;
        return;
      }

      const schoolId = schoolQuerySnapshot.docs[0].id;

      // 2. Use the correct schoolId to fetch the teachers subcollection
      const teachersCollection = collection(this.firestore, `schools/${schoolId}/teachers`);
      const teachersQuery = query(teachersCollection, orderBy('name'));
      const querySnapshot = await getDocs(teachersQuery);

      this.teachers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));

    } catch (err) {
      console.error('Error loading faculty:', err);
      this.error = 'An error occurred while loading the faculty information.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}