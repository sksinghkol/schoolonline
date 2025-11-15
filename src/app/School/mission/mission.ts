import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { QuillViewComponent } from 'ngx-quill';
import { SafeHtmlPipe } from '../../core/services/safe-html.pipe';

// Define an interface for type safety
interface MissionInfoData extends DocumentData {
  content: string;
}

@Component({
  selector: 'app-our-mission',
  standalone: true,
  imports: [CommonModule, QuillViewComponent, SafeHtmlPipe],
  templateUrl: './mission.html',
  styleUrls: ['./mission.scss']
})
export class Mission implements OnInit {
  missionInfoData: MissionInfoData | null = null;
  isLoadingMissionInfo = true;
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
        await this.loadMissionInfoContent(schoolSlug);
      } else {
        this.error = 'School identifier not found in URL.';
        this.isLoadingMissionInfo = false;
      }
    });
  }

  async loadMissionInfoContent(schoolSlug: string) {
    this.error = null;
    this.isLoadingMissionInfo = true;

    try {
      const schoolsCollection = collection(this.firestore, 'schools');
      const q = query(schoolsCollection, where('slug', '==', schoolSlug), limit(1));
      const schoolQuerySnapshot = await getDocs(q);

      if (schoolQuerySnapshot.empty) {
        this.error = `No school found with the identifier '${schoolSlug}'.`;
        this.isLoadingMissionInfo = false;
        return;
      }

      const schoolId = schoolQuerySnapshot.docs[0].id;
      const missionInfoDocRef = doc(this.firestore, `schools/${schoolId}/about_school/our_mission`);
      const docSnap = await getDoc(missionInfoDocRef);

      if (docSnap.exists()) {
        this.missionInfoData = docSnap.data() as MissionInfoData;
      } else {
        this.missionInfoData = null;
      }
    } catch (error) {
      console.error('Error loading "Our Mission" content:', error);
      this.error = 'An error occurred while loading the "Our Mission" information.';
    } finally {
      this.isLoadingMissionInfo = false;
      this.cdr.detectChanges();
    }
  }
}

