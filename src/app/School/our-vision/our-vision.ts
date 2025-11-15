import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { QuillViewComponent } from 'ngx-quill';
import { SafeHtmlPipe } from '../../core/services/safe-html.pipe';
interface VissionInfoData extends DocumentData {
  content: string;
}
@Component({
  selector: 'app-our-vision',
  imports: [CommonModule, QuillViewComponent, SafeHtmlPipe],
  templateUrl: './our-vision.html',
  styleUrl: './our-vision.scss'
})
export class OurVision implements OnInit {
  visionInfoData: VissionInfoData | null = null;
  isLoadingVisionInfo = true;
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
        await this.loadVisionInfoContent(schoolSlug);
      } else {
        this.error = 'School identifier not found in URL.';
        this.isLoadingVisionInfo = false;
      }
    });
  }

  async loadVisionInfoContent(schoolSlug: string) {
    this.error = null;
    this.isLoadingVisionInfo = true;

    try {
      const schoolsCollection = collection(this.firestore, 'schools');
      const q = query(schoolsCollection, where('slug', '==', schoolSlug), limit(1));
      const schoolQuerySnapshot = await getDocs(q);

      if (schoolQuerySnapshot.empty) {
        this.error = `No school found with the identifier '${schoolSlug}'.`;
        this.isLoadingVisionInfo = false;
        return;
      }

      const schoolId = schoolQuerySnapshot.docs[0].id;
      const visionInfoDocRef = doc(this.firestore, `schools/${schoolId}/about_school/our_vision`);
      const docSnap = await getDoc(visionInfoDocRef);

      if (docSnap.exists()) {
        this.visionInfoData = docSnap.data() as VissionInfoData;
      } else {
        this.visionInfoData = null;
      }
    } catch (error) {
      console.error('Error loading "Our Vision" content:', error);
      this.error = 'An error occurred while loading the "Our Vision" information.';
    } finally {
      this.isLoadingVisionInfo = false;
      this.cdr.detectChanges();
    }
  }
}

