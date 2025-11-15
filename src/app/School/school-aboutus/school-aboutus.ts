import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Firestore, doc, getDoc, DocumentData, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { QuillViewComponent } from 'ngx-quill'; 
import { SafeHtmlPipe } from '../../core/services/safe-html.pipe';

// Define an interface for type safety
interface AboutSchoolData extends DocumentData {
  content: string;
}

@Component({
  selector: 'app-school-aboutus',
  standalone: true,
  imports: [CommonModule, QuillViewComponent, SafeHtmlPipe],
  templateUrl: './school-aboutus.html',
  styleUrl: './school-aboutus.scss'
})
export class SchoolAboutus implements OnInit {
  aboutSchoolData: AboutSchoolData | null = null; // Use the type-safe interface
  isLoadingAboutSchool = true; // Set to true initially to show loading spinner
  error: string | null = null; // Added for error messages

  // Inject Firestore and ChangeDetectorRef
  constructor(
    private firestore: Firestore,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute // Inject ActivatedRoute
  ) {}

  async ngOnInit() {
    // Get school slug from the parent route's parameters
    this.route.parent?.paramMap.subscribe(async (params) => {
      const schoolSlug = params.get('schoolName'); // 'schoolName' is the parameter name from your routes
      if (schoolSlug) {
        await this.loadAboutSchoolContent(schoolSlug);
      } else {
        this.error = 'School identifier not found in URL.';
        this.isLoadingAboutSchool = false;
      }
    });
  }

  async loadAboutSchoolContent(schoolSlug: string) {
    this.error = null; // Clear any previous errors immediately
    this.isLoadingAboutSchool = true;

    try {
      // 1. Find the school document by its slug to get the actual document ID
      const schoolsCollection = collection(this.firestore, 'schools');
      const q = query(schoolsCollection, where('slug', '==', schoolSlug), limit(1));
      const schoolQuerySnapshot = await getDocs(q);

      if (schoolQuerySnapshot.empty) {
        this.error = `No school found with the identifier '${schoolSlug}'.`;
        this.isLoadingAboutSchool = false;
        return;
      }

      const schoolDoc = schoolQuerySnapshot.docs[0];
      const schoolId = schoolDoc.id;

      // 2. Use the correct schoolId to fetch the 'about_us' document
      const aboutDocRef = doc(this.firestore, `schools/${schoolId}/about_school/about_us`);
      const docSnap = await getDoc(aboutDocRef);

      if (docSnap.exists()) {
        this.aboutSchoolData = docSnap.data() as AboutSchoolData;
      } else {
        this.aboutSchoolData = null; // Set to null to correctly trigger the 'noContent' template
        this.error = "About Us information for this school has not been set up yet.";
      }
    } catch (error) {
      console.error('Error loading About School content:', error);
      this.error = 'An error occurred while loading the About Us information.';
    } finally {
      this.isLoadingAboutSchool = false;
      this.cdr.detectChanges(); // Manually trigger change detection to update UI
    }
  }
}