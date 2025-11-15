import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { QuillViewComponent } from 'ngx-quill';
import { SafeHtmlPipe } from '../../core/services/safe-html.pipe';

// Define an interface for type safety
interface FacilitiesInfoData extends DocumentData {
  content: string;
}

@Component({
  selector: 'app-our-facility',
  standalone: true,
  imports: [CommonModule, QuillViewComponent, SafeHtmlPipe],
  templateUrl: './our-facility.html',
  styleUrl: './our-facility.scss'
})
export class OurFacility implements OnInit {
  facilitiesInfoData: FacilitiesInfoData | null = null;
  isLoadingFacilitiesInfo = true;
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
        await this.loadFacilitiesInfoContent(schoolSlug);
      } else {
        this.error = 'School identifier not found in URL.';
        this.isLoadingFacilitiesInfo = false;
      }
    });
  }

  async loadFacilitiesInfoContent(schoolSlug: string) {
    this.error = null;
    this.isLoadingFacilitiesInfo = true;

    try {
      const schoolsCollection = collection(this.firestore, 'schools');
      const q = query(schoolsCollection, where('slug', '==', schoolSlug), limit(1));
      const schoolQuerySnapshot = await getDocs(q);

      if (schoolQuerySnapshot.empty) {
        this.error = `No school found with the identifier '${schoolSlug}'.`;
        this.isLoadingFacilitiesInfo = false;
        return;
      }

      const schoolId = schoolQuerySnapshot.docs[0].id;
      const facilitiesInfoDocRef = doc(this.firestore, `schools/${schoolId}/about_school/facilities`);
      const docSnap = await getDoc(facilitiesInfoDocRef);

      if (docSnap.exists()) {
        this.facilitiesInfoData = docSnap.data() as FacilitiesInfoData;
      } else {
        this.facilitiesInfoData = null;
      }
    } catch (error) {
      console.error('Error loading "Our Facilities" content:', error);
      this.error = 'An error occurred while loading the "Our Facilities" information.';
    } finally {
      this.isLoadingFacilitiesInfo = false;
      this.cdr.detectChanges();
    }
  }
}
