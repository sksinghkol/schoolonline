import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { QuillViewComponent } from 'ngx-quill';
import { SafeHtmlPipe } from '../../core/services/safe-html.pipe';

// Define an interface for type safety
interface CurriculumInfoData extends DocumentData {
  content: string;
}

@Component({
  selector: 'app-our-crriculam',
  standalone: true,
  imports: [CommonModule, QuillViewComponent, SafeHtmlPipe],
  templateUrl: './our-crriculam.html',
  styleUrls: ['./our-crriculam.scss']
})
export class OurCurriculum implements OnInit {
  curriculumInfoData: CurriculumInfoData | null = null;
  isLoadingCurriculumInfo = true;
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
        await this.loadCurriculumInfoContent(schoolSlug);
      } else {
        this.error = 'School identifier not found in URL.';
        this.isLoadingCurriculumInfo = false;
      }
    });
  }

  async loadCurriculumInfoContent(schoolSlug: string) {
    this.error = null;
    this.isLoadingCurriculumInfo = true;

    try {
      const schoolsCollection = collection(this.firestore, 'schools');
      const q = query(schoolsCollection, where('slug', '==', schoolSlug), limit(1));
      const schoolQuerySnapshot = await getDocs(q);

      if (schoolQuerySnapshot.empty) {
        this.error = `No school found with the identifier '${schoolSlug}'.`;
        this.isLoadingCurriculumInfo = false;
        return;
      }

      const schoolId = schoolQuerySnapshot.docs[0].id;
      const curriculumInfoDocRef = doc(this.firestore, `schools/${schoolId}/about_school/our_curriculum`);
      const docSnap = await getDoc(curriculumInfoDocRef);

      if (docSnap.exists()) {
        this.curriculumInfoData = docSnap.data() as CurriculumInfoData;
      } else {
        this.curriculumInfoData = null;
      }
    } catch (error) {
      console.error('Error loading "Our Curriculum" content:', error);
      this.error = 'An error occurred while loading the "Our Curriculum" information.';
    } finally {
      this.isLoadingCurriculumInfo = false;
      this.cdr.detectChanges();
    }
  }
}