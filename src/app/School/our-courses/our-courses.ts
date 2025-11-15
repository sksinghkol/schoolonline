import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { QuillViewComponent } from 'ngx-quill';
import { SafeHtmlPipe } from '../../core/services/safe-html.pipe';

// Define an interface for type safety
interface CoursesInfoData extends DocumentData {
  content: string;
}

@Component({
  selector: 'app-our-courses',
  standalone: true,
  imports: [CommonModule, QuillViewComponent, SafeHtmlPipe],
  templateUrl: './our-courses.html',
  styleUrls: ['./our-courses.scss']
})
export class OurCourses implements OnInit {
  coursesInfoData: CoursesInfoData | null = null;
  isLoadingCoursesInfo = true;
  error: string | null = null;

  constructor(
    private firestore: Firestore,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.route.parent?.paramMap.subscribe(async (params) => {
      const schoolSlug = params.get('schoolName');
      if (schoolSlug) {
        await this.loadCoursesInfoContent(schoolSlug);
      } else {
        this.error = 'School identifier not found in URL.';
        this.isLoadingCoursesInfo = false;
      }
    });
  }

  async loadCoursesInfoContent(schoolSlug: string) {
    this.error = null;
    this.isLoadingCoursesInfo = true;

    try {
      const schoolsCollection = collection(this.firestore, 'schools');
      const q = query(schoolsCollection, where('slug', '==', schoolSlug), limit(1));
      const schoolQuerySnapshot = await getDocs(q);

      if (schoolQuerySnapshot.empty) {
        this.error = `No school found with the identifier '${schoolSlug}'.`;
        this.isLoadingCoursesInfo = false;
        return;
      }

      const schoolId = schoolQuerySnapshot.docs[0].id;
      const coursesInfoDocRef = doc(this.firestore, `schools/${schoolId}/about_school/courses_info`);
      const docSnap = await getDoc(coursesInfoDocRef);

      if (docSnap.exists()) {
        this.coursesInfoData = docSnap.data() as CoursesInfoData;
      } else {
        this.coursesInfoData = null;
      }
    } catch (error) {
      console.error('Error loading "Our Courses" content:', error);
      this.error = 'An error occurred while loading the "Our Courses" information.';
    } finally {
      this.isLoadingCoursesInfo = false;
      this.cdr.detectChanges();
    }
  }
}