import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { QuillViewComponent } from 'ngx-quill';
import { SafeHtmlPipe } from '../../core/services/safe-html.pipe';

// Define an interface for type safety
interface SyllabusInfoData extends DocumentData {
  content: string;
}

@Component({
  selector: 'app-our-syllabus',
  standalone: true,
  imports: [CommonModule, QuillViewComponent, SafeHtmlPipe],
  templateUrl: './our-syllabus.html',
  styleUrls: ['./our-syllabus.scss']
})
export class OurSyllabus implements OnInit {
  syllabusInfoData: SyllabusInfoData | null = null;
  isLoadingSyllabusInfo = true;
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
        await this.loadSyllabusInfoContent(schoolSlug);
      } else {
        this.error = 'School identifier not found in URL.';
        this.isLoadingSyllabusInfo = false;
      }
    });
  }

  async loadSyllabusInfoContent(schoolSlug: string) {
    this.error = null;
    this.isLoadingSyllabusInfo = true;

    try {
      const schoolsCollection = collection(this.firestore, 'schools');
      const q = query(schoolsCollection, where('slug', '==', schoolSlug), limit(1));
      const schoolQuerySnapshot = await getDocs(q);

      if (schoolQuerySnapshot.empty) {
        this.error = `No school found with the identifier '${schoolSlug}'.`;
        this.isLoadingSyllabusInfo = false;
        return;
      }

      const schoolId = schoolQuerySnapshot.docs[0].id;
      const syllabusInfoDocRef = doc(this.firestore, `schools/${schoolId}/about_school/syllabus`);
      const docSnap = await getDoc(syllabusInfoDocRef);

      if (docSnap.exists()) {
        this.syllabusInfoData = docSnap.data() as SyllabusInfoData;
      } else {
        this.syllabusInfoData = null;
      }
    } catch (error) {
      console.error('Error loading "Our Syllabus" content:', error);
      this.error = 'An error occurred while loading the "Our Syllabus" information.';
    } finally {
      this.isLoadingSyllabusInfo = false;
      this.cdr.detectChanges();
    }
  }
}