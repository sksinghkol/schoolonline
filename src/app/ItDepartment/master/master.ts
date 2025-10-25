/// <reference types="@types/google.maps" />
import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
  setDoc
} from '@angular/fire/firestore';
import { SchoolStateService } from '../../core/services/school-state.service';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { QuillEditorComponent, QuillViewHTMLComponent } from 'ngx-quill';

// Define interfaces for better type safety
interface SchoolClass {
  id: string;
  className: string;
  section: string;
}

interface Subject {
  id: string;
  className: string;
  subjectName: string;
}

interface Chapter {
  id: string;
  className: string;
  subjectName: string;
  chapterName: string;
}

interface ExamType {
  id: string;
  examName: string;
}

interface FeeType {
  id: string;
  feeName: string;
}

interface Fee {
  id: string;
  className: string;
  feeTypeName: string;
  amount: number;
}

interface TransportStop {
  stopName: string;
  fee: number;
}
interface Transport {
  id: string;
  routeName: string;
  stops: TransportStop[];
}

interface Bus {
  id: string;
  busNumber: string;
  busType: string;
  seatingCapacity: number;
  routeId: string;
  driverName: string;
  driverLicense: string;
  driverContact: string;
  driverShift?: string;
  driverEmergencyContact?: string;
  conductorName?: string;
  insurancePermitNumber?: string;
  maintenanceSchedule?: string;
  fuelLogbook?: string;
}
@Component({
  selector: 'app-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GoogleMap, MapMarker, QuillEditorComponent, QuillViewHTMLComponent],
  templateUrl: './master.html',
  styleUrl: './master.scss'
})

export class Master implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private schoolState = inject(SchoolStateService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  @ViewChild('mapSearchField') searchField!: ElementRef;
  @ViewChild(GoogleMap) map!: GoogleMap;

  // Class management
  classForm: FormGroup;
  classes: SchoolClass[] = [];
  schoolId: string | null = null;
  isLoading = true;
  isEditing = false;
  currentClassId: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Subject management
  subjectForm: FormGroup;
  subjects: Subject[] = [];
  isLoadingSubjects = true;
  isEditingSubject = false;
  currentSubjectId: string | null = null;
  classes$: Observable<SchoolClass[]>;

  // Chapter management
  chapterForm: FormGroup;
  chapters: Chapter[] = [];
  isLoadingChapters = true;
  isEditingChapter = false;
  currentChapterId: string | null = null;
  private selectedClassForChapter$ = new BehaviorSubject<string | null>(null);
  subjectsForClass$: Observable<Subject[]>;

  // Exam Type management
  examTypeForm: FormGroup;
  examTypes: ExamType[] = [];
  isLoadingExamTypes = true;
  isEditingExamType = false;
  currentExamTypeId: string | null = null;

  // Fee Type management
  feeTypeForm: FormGroup;
  feeTypes: FeeType[] = [];
  isLoadingFeeTypes = true;
  isEditingFeeType = false;
  currentFeeTypeId: string | null = null;

  // Fee management
  feeForm: FormGroup;
  fees: Fee[] = [];
  isLoadingFees = true;
  isEditingFee = false;
  currentFeeId: string | null = null;

  // Transport management
  transportForm: FormGroup;
  transports: Transport[] = [];
  isLoadingTransports = true;
  isEditingTransport = false;
  currentTransportId: string | null = null;

  // Bus Details management
  busForm: FormGroup;
  buses: Bus[] = [];
  isLoadingBuses = true;
  isEditingBus = false;
  currentBusId: string | null = null;

  // Syllabus management
  syllabusForm: FormGroup;
  isLoadingSyllabus = false;
  isEditingSyllabus = false;
  syllabusContent: { [syllabusId: string]: string | null } = {}; // Key is "classId_subjectId"
  selectedClassForSyllabus: string | null = null;
  selectedSubjectForSyllabus: string | null = null;
  uniqueClassesForDropdown$: Observable<SchoolClass[]>;
  private selectedClassForSyllabus$ = new BehaviorSubject<string | null>(null);
  subjectsForSyllabus$: Observable<Subject[]>;

  // About Us management
  aboutSchoolForm: FormGroup;
  isLoadingAboutSchool = true;
  isEditingAboutSchool = false; // To toggle between view and edit mode
  aboutSchoolContent: string | null = null;

  // Our Courses management
  coursesInfoForm: FormGroup;
  isLoadingCoursesInfo = true;
  isEditingCoursesInfo = false;
  coursesInfoContent: string | null = null;

  // Our Curriculum management
  curriculumInfoForm: FormGroup;
  isLoadingCurriculumInfo = true;
  isEditingCurriculumInfo = false;
  curriculumInfoContent: string | null = null;

  // Our Facilities management
  facilitiesInfoForm: FormGroup;
  isLoadingFacilitiesInfo = true;
  isEditingFacilitiesInfo = false;
  facilitiesInfoContent: string | null = null;

  // School Details management
  schoolDetailsForm: FormGroup;
  isLoadingSchoolDetails = true;
  isEditingSchoolDetails = false;
  schoolData: any = null;

  // Google Map properties
  mapOptions: google.maps.MapOptions = {
    center: { lat: 20.5937, lng: 78.9629 }, // Default to center of India
    mapTypeControl: false,
    zoom: 5,
    mapTypeId: 'roadmap'
  };
  markerPosition: google.maps.LatLngLiteral | null = null;

  // Autocomplete
  autocompleteService: google.maps.places.AutocompleteService | undefined;
  placesService: google.maps.places.PlacesService | undefined;
  autocompletePredictions: google.maps.places.AutocompletePrediction[] = [];

  constructor() {
    this.classForm = this.fb.group({
      className: ['', Validators.required],
      section: ['', Validators.required]
    });

    this.subjectForm = this.fb.group({
      className: ['', Validators.required],
      subjectName: ['', Validators.required],
    });

    this.chapterForm = this.fb.group({
      className: ['', Validators.required],
      subjectName: ['', Validators.required],
      chapterName: ['', Validators.required],
    });

    this.examTypeForm = this.fb.group({
      examName: ['', Validators.required]
    });

    this.feeTypeForm = this.fb.group({
      feeName: ['', Validators.required]
    });

    this.feeForm = this.fb.group({
      className: ['', Validators.required],
      feeTypeName: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]]
    });

    this.transportForm = this.fb.group({
      routeName: ['', Validators.required],
      stops: this.fb.array([this.createStopGroup()])
    });

    this.busForm = this.fb.group({
      busNumber: ['', Validators.required],
      busType: ['', Validators.required],
      seatingCapacity: ['', [Validators.required, Validators.min(1)]],
      routeId: ['', Validators.required],
      driverName: ['', Validators.required],
      driverLicense: ['', Validators.required],
      driverContact: ['', Validators.required],
      driverShift: [''],
      driverEmergencyContact: [''],
      conductorName: [''],
      insurancePermitNumber: [''],
      maintenanceSchedule: [''],
      fuelLogbook: ['']
    });

    this.syllabusForm = this.fb.group({
      classId: ['', Validators.required],
      subjectId: ['', Validators.required],
      content: ['', Validators.required]
    });

    this.aboutSchoolForm = this.fb.group({
      content: ['', Validators.required]
    });

    this.coursesInfoForm = this.fb.group({
      content: ['', Validators.required]
    });

    this.curriculumInfoForm = this.fb.group({
      content: ['', Validators.required]
    });

    this.facilitiesInfoForm = this.fb.group({
      content: ['', Validators.required]
    });

    this.schoolDetailsForm = this.fb.group({
      name: ['', Validators.required],
      slug: [''],
      school_type: ['', Validators.required],
      establishment_year: ['', [Validators.required, Validators.min(1800), Validators.max(new Date().getFullYear())]],
      ownership_type: ['', Validators.required],
      address: [''],
      state: [''],
      city: [''],
      zip_code: [''],
      country: ['India'],
      latitude: [''],
      longitude: [''],
      phone_primary: [''],
      phone_secondary: [''],
      email: ['', [Validators.email]],
      website: [''],
      enrollment_capacity: ['', [Validators.min(1)]],
      curriculum_type: ['', Validators.required]
    });

    // Observable for class dropdowns
    this.classes$ = this.schoolState.schoolId$.pipe(
      switchMap(schoolId => {
        if (!schoolId) return of([]);
        const classesCollection = collection(this.firestore, `schools/${schoolId}/classes`);
        const q = query(classesCollection, orderBy('className'));
        return new Observable<SchoolClass[]>(subscriber => {
          const unsubscribe = onSnapshot(q, snapshot => {
            const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SchoolClass));
            // Deduplicate class names for dropdowns
            const uniqueClassNames = [...new Map(classes.map(item => [item.className, item])).values()];
            subscriber.next(uniqueClassNames);
          });
          return unsubscribe;
        });
      })
    );

    // Use a separate observable for the syllabus dropdown to show all class/section combos
    this.uniqueClassesForDropdown$ = this.schoolState.schoolId$.pipe(
      switchMap(schoolId => {
        if (!schoolId) return of([]);
        const classesCollection = collection(this.firestore, `schools/${schoolId}/classes`);
        const q = query(classesCollection, orderBy('className'), orderBy('section'));
        return new Observable<SchoolClass[]>(subscriber => {
          const unsubscribe = onSnapshot(q, snapshot => subscriber.next(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SchoolClass))));
          return unsubscribe;
        });
      })
    );
    // Observable for subject dropdown in chapter form
    this.subjectsForClass$ = this.selectedClassForChapter$.pipe(
      switchMap(className => {
        if (!className || !this.schoolId) {
          return of([]);
        }
        const subjectsCollection = collection(this.firestore, `schools/${this.schoolId}/subjects`);
        const q = query(subjectsCollection, where('className', '==', className), orderBy('subjectName'));
        return new Observable<Subject[]>(subscriber => {
          const unsubscribe = onSnapshot(q, snapshot => {
            const subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
            subscriber.next(subjects);
          });
          return unsubscribe;
        });
      })
    );

    // Observable for subject dropdown in syllabus form
    this.subjectsForSyllabus$ = this.selectedClassForSyllabus$.pipe(
      switchMap(classId => {
        if (!classId || !this.schoolId) {
          return of([]);
        }
        const subjectsCollection = collection(this.firestore, `schools/${this.schoolId}/subjects`);
        const q = query(subjectsCollection, where('className', '==', this.classes.find(c => c.id === classId)?.className), orderBy('subjectName'));
        return new Observable<Subject[]>(subscriber => {
          const unsubscribe = onSnapshot(q, snapshot => {
            subscriber.next(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
          });
          return unsubscribe;
        });
      })
    );
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      // The map object might not be immediately available, so we create the PlacesService with the map's div.
      if (this.map.googleMap) {
        this.placesService = new google.maps.places.PlacesService(this.map.googleMap);
      }
    });
  }

  onLocationInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (input && this.autocompleteService) {
      this.autocompleteService.getPlacePredictions({ input, componentRestrictions: { country: 'in' } }, (predictions, status) => {
        this.ngZone.run(() => {
          if (status === 'OK' && predictions) {
            this.autocompletePredictions = predictions;
          } else {
            this.autocompletePredictions = [];
          }
          this.cdr.detectChanges();
        });
      });
    } else {
      this.autocompletePredictions = [];
    }
  }

  onPredictionSelected(prediction: google.maps.places.AutocompletePrediction): void {
    if (!this.placesService || !prediction.place_id) {
      return;
    }

    this.placesService.getDetails({ placeId: prediction.place_id, fields: ['geometry', 'viewport'] }, (place, status) => {
      if (status === 'OK' && place && place.geometry && place.geometry.location) {
        this.ngZone.run(() => {
          this.onMapClick({ latLng: place.geometry!.location! });
          this.autocompletePredictions = []; // Hide predictions
          this.searchField.nativeElement.value = prediction.description; // Update input field text
        });
      }
    });
  }

  geocodeZipCode() {
    if (!this.isEditingSchoolDetails) return;

    const zipCode = this.schoolDetailsForm.get('zip_code')?.value;
    if (!zipCode) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: zipCode, componentRestrictions: { country: 'IN' } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        this.onMapClick({ latLng: location });
      } else {
        console.warn('Geocode was not successful for the following reason: ' + status);
        // Optionally, show an error to the user
      }
    });
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (this.isEditingSchoolDetails && event.latLng) {
      this.ngZone.run(() => {
        const position = event.latLng!.toJSON();
        this.updateMarkerAndForm(position);
      });
    }
  }
  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.schoolId = params.get('schoolId');
      if (this.schoolId) {
        this.schoolState.setSchoolId(this.schoolId);
        this.loadClasses();
        this.loadSubjects();
        this.loadChapters();
        this.loadExamTypes();
        this.loadFeeTypes();
        this.loadFees();
        this.loadTransports();
        this.loadBuses();
        this.loadAboutSchoolContent();
        // Syllabus content is loaded on class selection
        this.loadCoursesInfoContent();
        this.loadCurriculumInfoContent();
        this.loadFacilitiesInfoContent();
        this.loadSchoolDetails();
      } else {
        this.errorMessage = "School ID not found in URL. Please ensure you are navigating from the dashboard.";
        this.isLoading = false;
        this.isLoadingSubjects = false;
        this.isLoadingChapters = false;
        this.isLoadingExamTypes = false;
        this.isLoadingFees = false;
        this.isLoadingFeeTypes = false;
        this.isLoadingCoursesInfo = false;
        this.isLoadingFacilitiesInfo = false;
        this.isLoadingSchoolDetails = false;
        this.isLoadingCurriculumInfo = false;
        this.isLoadingTransports = false;
        this.isLoadingBuses = false;
        this.isLoadingSyllabus = false;
        this.isLoadingAboutSchool = false;
      }
    });
  }

  // --- Class Management ---
  async loadClasses() {
    if (!this.schoolId) return;
    this.isLoading = true;
    const classesCollection = collection(this.firestore, `schools/${this.schoolId}/classes`);
    const q = query(classesCollection, orderBy('className'), orderBy('section'));
    onSnapshot(q, (querySnapshot) => {
      this.classes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SchoolClass));
      this.isLoading = false;
    }, (error) => {
      console.error("Error loading classes:", error);
      this.errorMessage = "Failed to load classes.";
      this.isLoading = false;
    });
  }

  async onSubmit() {
    if (this.classForm.invalid || !this.schoolId) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    const { className, section } = this.classForm.value;

    try {
      if (this.isEditing && this.currentClassId) {
        const classDocRef = doc(this.firestore, `schools/${this.schoolId}/classes/${this.currentClassId}`);
        await updateDoc(classDocRef, { ...this.classForm.value, updatedAt: serverTimestamp() });
        this.successMessage = "Class updated successfully.";
      } else {
        // Check for duplicates before adding
        const q = query(collection(this.firestore, `schools/${this.schoolId}/classes`), where('className', '==', className), where('section', '==', section));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          this.errorMessage = `The class "${className} - ${section}" already exists.`;
          return;
        }

        const classesCollection = collection(this.firestore, `schools/${this.schoolId}/classes`);
        await addDoc(classesCollection, { ...this.classForm.value, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        this.successMessage = "Class added successfully.";
      }
      this.resetForm();
    } catch (error) {
      console.error("Error saving class:", error);
      this.errorMessage = "Failed to save class.";
    }
  }

  editClass(classItem: SchoolClass) {
    this.isEditing = true;
    this.currentClassId = classItem.id;
    this.classForm.setValue({
      className: classItem.className,
      section: classItem.section
    });
  }

  async deleteClass(classId: string) {
    if (!this.schoolId || !confirm('Are you sure you want to delete this class?')) return;
    const classDocRef = doc(this.firestore, `schools/${this.schoolId}/classes/${classId}`);
    try {
      await deleteDoc(classDocRef);
      this.successMessage = "Class deleted successfully.";
    } catch (error) {
      console.error("Error deleting class:", error);
      this.errorMessage = "Failed to delete class.";
    }
  }

  resetForm() {
    this.isEditing = false;
    this.currentClassId = null;
    this.classForm.reset();
    this.successMessage = null;
    this.errorMessage = null;
  }

  // --- Subject Management ---
  loadSubjects() {
    if (!this.schoolId) return;
    this.isLoadingSubjects = true;
    const subjectsCollection = collection(this.firestore, `schools/${this.schoolId}/subjects`);
    const q = query(subjectsCollection, orderBy('className'), orderBy('subjectName'));
    onSnapshot(q, (snapshot) => {
      this.subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      this.isLoadingSubjects = false;
    }, (error) => {
      console.error("Error loading subjects:", error);
      this.isLoadingSubjects = false;
    });
  }

  async onSubjectSubmit() {
    if (this.subjectForm.invalid || !this.schoolId) return;

    this.errorMessage = null;
    this.successMessage = null;
    const subjectData = this.subjectForm.value;

    try {
      if (this.isEditingSubject && this.currentSubjectId) {
        const subjectDoc = doc(this.firestore, `schools/${this.schoolId}/subjects/${this.currentSubjectId}`);
        await updateDoc(subjectDoc, subjectData);
        this.successMessage = "Subject updated successfully.";
      } else {
        // Check for duplicates before adding
        const q = query(collection(this.firestore, `schools/${this.schoolId}/subjects`), where('className', '==', subjectData.className), where('subjectName', '==', subjectData.subjectName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          this.errorMessage = `The subject "${subjectData.subjectName}" already exists for class "${subjectData.className}".`;
          return;
        }

        const subjectsCollection = collection(this.firestore, `schools/${this.schoolId}/subjects`);
        await addDoc(subjectsCollection, subjectData);
        this.successMessage = "Subject added successfully.";
      }
      this.resetSubjectForm();
    } catch (error) {
      console.error("Error saving subject:", error);
      this.errorMessage = "Failed to save subject.";
    }
  }

  editSubject(subject: Subject) {
    this.isEditingSubject = true;
    this.currentSubjectId = subject.id;
    this.subjectForm.setValue({ className: subject.className, subjectName: subject.subjectName });
  }

  async deleteSubject(subjectId: string) {
    if (!this.schoolId || !confirm('Are you sure you want to delete this subject?')) return;
    const subjectDoc = doc(this.firestore, `schools/${this.schoolId}/subjects/${subjectId}`);
    try {
      await deleteDoc(subjectDoc);
      this.successMessage = "Subject deleted successfully.";
    } catch (error) {
      console.error("Error deleting subject:", error);
      this.errorMessage = "Failed to delete subject.";
    }
  }

  resetSubjectForm() {
    this.isEditingSubject = false;
    this.currentSubjectId = null;
    this.subjectForm.reset();
    this.successMessage = null;
    this.errorMessage = null;
  }

  // --- Chapter Management ---
  loadChapters() {
    if (!this.schoolId) return;
    this.isLoadingChapters = true;
    const chaptersCollection = collection(this.firestore, `schools/${this.schoolId}/chapters`);
    const q = query(chaptersCollection, orderBy('className'), orderBy('subjectName'), orderBy('chapterName'));
    onSnapshot(q, (snapshot) => {
      this.chapters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter));
      this.isLoadingChapters = false;
    }, (error) => {
      console.error("Error loading chapters:", error);
      this.isLoadingChapters = false;
    });
  }

  onClassChangeForChapter(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedClassForChapter$.next(target.value);
    this.chapterForm.patchValue({ subjectName: '' });
  }

  async onChapterSubmit() {
    if (this.chapterForm.invalid || !this.schoolId) return;

    this.errorMessage = null;
    this.successMessage = null;
    const chapterData = this.chapterForm.value;

    try {
      if (this.isEditingChapter && this.currentChapterId) {
        const chapterDoc = doc(this.firestore, `schools/${this.schoolId}/chapters/${this.currentChapterId}`);
        await updateDoc(chapterDoc, chapterData);
        this.successMessage = "Chapter updated successfully.";
      } else {
        // Check for duplicates before adding
        const q = query(collection(this.firestore, `schools/${this.schoolId}/chapters`),
          where('className', '==', chapterData.className),
          where('subjectName', '==', chapterData.subjectName),
          where('chapterName', '==', chapterData.chapterName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          this.errorMessage = `The chapter "${chapterData.chapterName}" already exists for subject "${chapterData.subjectName}" in class "${chapterData.className}".`;
          return;
        }
        const chaptersCollection = collection(this.firestore, `schools/${this.schoolId}/chapters`);
        await addDoc(chaptersCollection, chapterData);
        this.successMessage = "Chapter added successfully.";
      }
      this.resetChapterForm();
    } catch (error) {
      console.error("Error saving chapter:", error);
      this.errorMessage = "Failed to save chapter.";
    }
  }

  editChapter(chapter: Chapter) {
    this.isEditingChapter = true;
    this.currentChapterId = chapter.id;
    this.selectedClassForChapter$.next(chapter.className); // Trigger subject loading for the class
    this.chapterForm.setValue({
      className: chapter.className,
      subjectName: chapter.subjectName,
      chapterName: chapter.chapterName
    });
  }

  async deleteChapter(chapterId: string) {
    if (!this.schoolId || !confirm('Are you sure you want to delete this chapter?')) return;
    const chapterDoc = doc(this.firestore, `schools/${this.schoolId}/chapters/${chapterId}`);
    try {
      await deleteDoc(chapterDoc);
      this.successMessage = "Chapter deleted successfully.";
    } catch (error) {
      console.error("Error deleting chapter:", error);
      this.errorMessage = "Failed to delete chapter.";
    }
  }

  resetChapterForm() {
    this.isEditingChapter = false;
    this.currentChapterId = null;
    this.chapterForm.reset();
    this.selectedClassForChapter$.next(null);
    this.successMessage = null;
    this.errorMessage = null;
  }

  // --- Exam Type Management ---
  async loadExamTypes() {
    if (!this.schoolId) return;
    this.isLoadingExamTypes = true;
    const examTypesCollection = collection(this.firestore, `schools/${this.schoolId}/exam_types`);
    const q = query(examTypesCollection, orderBy('examName'));
    onSnapshot(q, (querySnapshot) => {
      this.examTypes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamType));
      this.isLoadingExamTypes = false;
    }, (error) => {
      console.error("Error loading exam types:", error);
      this.errorMessage = "Failed to load exam types.";
      this.isLoadingExamTypes = false;
    });
  }

  async onExamTypeSubmit() {
    if (this.examTypeForm.invalid || !this.schoolId) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    const { examName } = this.examTypeForm.value;

    try {
      const examTypesCollection = collection(this.firestore, `schools/${this.schoolId}/exam_types`);
      if (this.isEditingExamType && this.currentExamTypeId) {
        const examTypeDocRef = doc(this.firestore, `schools/${this.schoolId}/exam_types/${this.currentExamTypeId}`);
        await updateDoc(examTypeDocRef, { examName, updatedAt: serverTimestamp() });
        this.successMessage = "Exam Type updated successfully.";
      } else {
        // Check for duplicates before adding
        const q = query(examTypesCollection, where('examName', '==', examName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          this.errorMessage = `The exam type "${examName}" already exists.`;
          return;
        }

        await addDoc(examTypesCollection, { examName, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        this.successMessage = "Exam Type added successfully.";
      }
      this.resetExamTypeForm();
    } catch (error) {
      console.error("Error saving exam type:", error);
      this.errorMessage = "Failed to save exam type.";
    }
  }

  editExamType(examType: ExamType) {
    this.isEditingExamType = true;
    this.currentExamTypeId = examType.id;
    this.examTypeForm.setValue({ examName: examType.examName });
  }

  async deleteExamType(examTypeId: string) {
    if (!this.schoolId || !confirm('Are you sure you want to delete this exam type?')) return;
    const examTypeDocRef = doc(this.firestore, `schools/${this.schoolId}/exam_types/${examTypeId}`);
    try {
      await deleteDoc(examTypeDocRef);
      this.successMessage = "Exam Type deleted successfully.";
    } catch (error) {
      console.error("Error deleting exam type:", error);
      this.errorMessage = "Failed to delete exam type.";
    }
  }

  resetExamTypeForm() {
    this.isEditingExamType = false;
    this.currentExamTypeId = null;
    this.examTypeForm.reset();
    this.successMessage = null;
    this.errorMessage = null;
  }

  // --- Fee Type Management ---
  async loadFeeTypes() {
    if (!this.schoolId) return;
    this.isLoadingFeeTypes = true;
    const feeTypesCollection = collection(this.firestore, `schools/${this.schoolId}/fee_types`);
    const q = query(feeTypesCollection, orderBy('feeName'));
    onSnapshot(q, (querySnapshot) => {
      this.feeTypes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeType));
      this.isLoadingFeeTypes = false;
    }, (error) => {
      console.error("Error loading fee types:", error);
      this.errorMessage = "Failed to load fee types.";
      this.isLoadingFeeTypes = false;
    });
  }

  async onFeeTypeSubmit() {
    if (this.feeTypeForm.invalid || !this.schoolId) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    const { feeName } = this.feeTypeForm.value;

    try {
      const feeTypesCollection = collection(this.firestore, `schools/${this.schoolId}/fee_types`);
      if (this.isEditingFeeType && this.currentFeeTypeId) {
        const feeTypeDocRef = doc(this.firestore, `schools/${this.schoolId}/fee_types/${this.currentFeeTypeId}`);
        await updateDoc(feeTypeDocRef, { feeName, updatedAt: serverTimestamp() });
        this.successMessage = "Fee Type updated successfully.";
      } else {
        // Check for duplicates before adding
        const q = query(feeTypesCollection, where('feeName', '==', feeName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          this.errorMessage = `The fee type "${feeName}" already exists.`;
          return;
        }

        await addDoc(feeTypesCollection, { feeName, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        this.successMessage = "Fee Type added successfully.";
      }
      this.resetFeeTypeForm();
    } catch (error) {
      console.error("Error saving fee type:", error);
      this.errorMessage = "Failed to save fee type.";
    }
  }

  editFeeType(feeType: FeeType) {
    this.isEditingFeeType = true;
    this.currentFeeTypeId = feeType.id;
    this.feeTypeForm.setValue({ feeName: feeType.feeName });
  }

  async deleteFeeType(feeTypeId: string) {
    if (!this.schoolId || !confirm('Are you sure you want to delete this fee type?')) return;
    const feeTypeDocRef = doc(this.firestore, `schools/${this.schoolId}/fee_types/${feeTypeId}`);
    try {
      await deleteDoc(feeTypeDocRef);
      this.successMessage = "Fee Type deleted successfully.";
    } catch (error) {
      console.error("Error deleting fee type:", error);
      this.errorMessage = "Failed to delete fee type.";
    }
  }

  resetFeeTypeForm() {
    this.isEditingFeeType = false;
    this.currentFeeTypeId = null;
    this.feeTypeForm.reset();
    this.successMessage = null;
    this.errorMessage = null;
  }

  // --- Fee Management ---
  async loadFees() {
    if (!this.schoolId) return;
    this.isLoadingFees = true;
    const feesCollection = collection(this.firestore, `schools/${this.schoolId}/fees`);
    const q = query(feesCollection, orderBy('className'), orderBy('feeTypeName'));
    onSnapshot(q, (querySnapshot) => {
      this.fees = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee));
      this.isLoadingFees = false;
    }, (error) => {
      console.error("Error loading fees:", error);
      this.errorMessage = "Failed to load fees.";
      this.isLoadingFees = false;
    });
  }

  async onFeeSubmit() {
    if (this.feeForm.invalid || !this.schoolId) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    const feeData = this.feeForm.value;

    try {
      const feesCollection = collection(this.firestore, `schools/${this.schoolId}/fees`);
      if (this.isEditingFee && this.currentFeeId) {
        const feeDocRef = doc(this.firestore, `schools/${this.schoolId}/fees/${this.currentFeeId}`);
        await updateDoc(feeDocRef, { ...feeData, updatedAt: serverTimestamp() });
        this.successMessage = "Fee updated successfully.";
      } else {
        // Check for duplicates before adding
        const q = query(feesCollection,
          where('className', '==', feeData.className),
          where('feeTypeName', '==', feeData.feeTypeName)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          this.errorMessage = `This fee type is already configured for the selected class.`;
          return;
        }

        await addDoc(feesCollection, { ...feeData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        this.successMessage = "Fee added successfully.";
      }
      this.resetFeeForm();
    } catch (error) {
      console.error("Error saving fee:", error);
      this.errorMessage = "Failed to save fee.";
    }
  }

  editFee(fee: Fee) {
    this.isEditingFee = true;
    this.currentFeeId = fee.id;
    this.feeForm.setValue({
      className: fee.className,
      feeTypeName: fee.feeTypeName,
      amount: fee.amount
    });
  }

  async deleteFee(feeId: string) {
    if (!this.schoolId || !confirm('Are you sure you want to delete this fee configuration?')) return;
    const feeDocRef = doc(this.firestore, `schools/${this.schoolId}/fees/${feeId}`);
    try {
      await deleteDoc(feeDocRef);
      this.successMessage = "Fee configuration deleted successfully.";
    } catch (error) {
      console.error("Error deleting fee:", error);
      this.errorMessage = "Failed to delete fee configuration.";
    }
  }

  resetFeeForm() {
    this.isEditingFee = false;
    this.currentFeeId = null;
    this.feeForm.reset();
    this.successMessage = null;
    this.errorMessage = null;
  }

  // --- FormArray Helpers for Transport ---
  get stopsFormArray() {
    return this.transportForm.get('stops') as FormArray;
  }

  createStopGroup(): FormGroup {
    return this.fb.group({
      stopName: ['', Validators.required],
      fee: ['', [Validators.required, Validators.min(0)]]
    });
  }

  addStop(): void { this.stopsFormArray.push(this.createStopGroup()); }
  removeStop(index: number): void { this.stopsFormArray.removeAt(index); }

  // --- Transport Management ---
  async loadTransports() {
    if (!this.schoolId) return;
    this.isLoadingTransports = true;
    const transportsCollection = collection(this.firestore, `schools/${this.schoolId}/transports`);
    const q = query(transportsCollection, orderBy('routeName'));
    onSnapshot(q, (querySnapshot) => {
      this.transports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transport));
      this.isLoadingTransports = false;
    }, (error) => {
      console.error("Error loading transport routes:", error);
      this.errorMessage = "Failed to load transport routes.";
      this.isLoadingTransports = false;
    });
  }

  async onTransportSubmit() {
    if (this.transportForm.invalid || !this.schoolId) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    const transportData = this.transportForm.value;

    try {
      if (this.isEditingTransport && this.currentTransportId) {
        const transportDocRef = doc(this.firestore, `schools/${this.schoolId}/transports/${this.currentTransportId}`);
        await updateDoc(transportDocRef, { ...transportData, updatedAt: serverTimestamp() });
        this.successMessage = "Transport route updated successfully.";
      } else {
        const transportsCollection = collection(this.firestore, `schools/${this.schoolId}/transports`);
        await addDoc(transportsCollection, { ...transportData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        this.successMessage = "Transport route added successfully.";
      }
      this.resetTransportForm();
    } catch (error) {
      console.error("Error saving transport route:", error);
      this.errorMessage = "Failed to save transport route.";
    }
  }

  editTransport(route: Transport) {
    this.isEditingTransport = true;
    this.currentTransportId = route.id;
    this.transportForm.patchValue({ routeName: route.routeName });

    this.stopsFormArray.clear();
    route.stops.forEach(stop => this.stopsFormArray.push(this.fb.group(stop)));
  }

  async deleteTransport(transportId: string) {
    if (!this.schoolId || !confirm('Are you sure you want to delete this transport route?')) return;
    const transportDocRef = doc(this.firestore, `schools/${this.schoolId}/transports/${transportId}`);
    try {
      await deleteDoc(transportDocRef);
      this.successMessage = "Transport route deleted successfully.";
    } catch (error) {
      console.error("Error deleting transport route:", error);
      this.errorMessage = "Failed to delete transport route.";
    }
  }

  resetTransportForm() {
    this.isEditingTransport = false;
    this.currentTransportId = null;
    this.transportForm.reset();
    this.stopsFormArray.clear();
    this.stopsFormArray.push(this.createStopGroup());
  }

  // --- Bus Details Management ---
  async loadBuses() {
    if (!this.schoolId) return;
    this.isLoadingBuses = true;
    const busesCollection = collection(this.firestore, `schools/${this.schoolId}/buses`);
    const q = query(busesCollection, orderBy('busNumber'));
    onSnapshot(q, (querySnapshot) => {
      this.buses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bus));
      this.isLoadingBuses = false;
    }, (error) => {
      console.error("Error loading buses:", error);
      this.errorMessage = "Failed to load buses.";
      this.isLoadingBuses = false;
    });
  }

  async onBusSubmit() {
    if (this.busForm.invalid || !this.schoolId) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    const busData = this.busForm.value;

    try {
      if (this.isEditingBus && this.currentBusId) {
        const busDocRef = doc(this.firestore, `schools/${this.schoolId}/buses/${this.currentBusId}`);
        await updateDoc(busDocRef, { ...busData, updatedAt: serverTimestamp() });
        this.successMessage = "Bus details updated successfully.";
      } else {
        const busesCollection = collection(this.firestore, `schools/${this.schoolId}/buses`);
        await addDoc(busesCollection, { ...busData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        this.successMessage = "Bus added successfully.";
      }
      this.resetBusForm();
    } catch (error) {
      console.error("Error saving bus:", error);
      this.errorMessage = "Failed to save bus details.";
    }
  }

  editBus(bus: Bus) {
    this.isEditingBus = true;
    this.currentBusId = bus.id;
    this.busForm.patchValue(bus);
  }

  async deleteBus(busId: string) {
    if (!this.schoolId || !confirm('Are you sure you want to delete this bus?')) return;
    const busDocRef = doc(this.firestore, `schools/${this.schoolId}/buses/${busId}`);
    try {
      await deleteDoc(busDocRef);
      this.successMessage = "Bus deleted successfully.";
    } catch (error) {
      console.error("Error deleting bus:", error);
      this.errorMessage = "Failed to delete bus.";
    }
  }

  resetBusForm() {
    this.isEditingBus = false;
    this.currentBusId = null;
    this.busForm.reset({
      // You can set default values here if needed
    });
    this.successMessage = null;
    this.errorMessage = null;
  }

  // --- Syllabus Management ---
  onSyllabusClassChange(event: Event) {
    const classId = (event.target as HTMLSelectElement).value;
    this.selectedClassForSyllabus = classId;
    this.selectedClassForSyllabus$.next(classId);
    this.selectedSubjectForSyllabus = null; // Reset subject
    this.errorMessage = null;
    this.successMessage = null;
    this.isEditingSyllabus = false;

    if (classId) {
      this.syllabusForm.patchValue({ classId, subjectId: '', content: '' });
    } else {
      this.syllabusForm.reset();
    }
  }

  onSyllabusSubjectChange(event: Event) {
    const subjectId = (event.target as HTMLSelectElement).value;
    this.selectedSubjectForSyllabus = subjectId;
    this.errorMessage = null;
    this.successMessage = null;

    if (subjectId && this.selectedClassForSyllabus) {
      this.syllabusForm.patchValue({ subjectId });
      const syllabusId = `${this.selectedClassForSyllabus}_${subjectId}`;
      if (this.syllabusContent[syllabusId] === undefined) {
        this.loadSyllabusForClassAndSubject(this.selectedClassForSyllabus, subjectId);
      } else {
        this.syllabusForm.patchValue({ content: this.syllabusContent[syllabusId] || '' });
        this.isEditingSyllabus = !this.syllabusContent[syllabusId];
      }
    } else {
      this.syllabusForm.patchValue({ subjectId: '', content: '' });
      this.isEditingSyllabus = false;
    }
  }

  getSyllabusContent(): string | null {
    if (!this.selectedClassForSyllabus || !this.selectedSubjectForSyllabus) return null;
    const syllabusId = `${this.selectedClassForSyllabus}_${this.selectedSubjectForSyllabus}`;
    return this.syllabusContent[syllabusId];
  }

  async loadSyllabusForClassAndSubject(classId: string, subjectId: string) {
    if (!this.schoolId) return;
    const syllabusId = `${classId}_${subjectId}`;
    this.isLoadingSyllabus = true;
    const syllabusDocRef = doc(this.firestore, `schools/${this.schoolId}/syllabus/${syllabusId}`);

    onSnapshot(syllabusDocRef, (docSnap) => {
      this.ngZone.run(() => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          this.syllabusContent[syllabusId] = data['content'];
          this.syllabusForm.patchValue({ content: data['content'] });
          this.isEditingSyllabus = false;
        } else {
          this.syllabusContent[syllabusId] = null;
          this.syllabusForm.patchValue({ content: '' });
          this.isEditingSyllabus = true; // No content, so open in edit mode
        }
        this.isLoadingSyllabus = false;
      });
    }, (error) => {
      console.error(`Error loading syllabus for ${syllabusId}:`, error);
      this.errorMessage = "Failed to load syllabus content.";
      this.isLoadingSyllabus = false;
    });
  }

  async onSyllabusSubmit() {
    if (this.syllabusForm.invalid || !this.schoolId || !this.selectedClassForSyllabus || !this.selectedSubjectForSyllabus) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;

    const { classId, subjectId, content } = this.syllabusForm.value;
    const syllabusId = `${classId}_${subjectId}`;
    const syllabusDocRef = doc(this.firestore, `schools/${this.schoolId}/syllabus/${syllabusId}`);

    try {
      await setDoc(syllabusDocRef, {
        classId,
        subjectId,
        content,
        updatedAt: serverTimestamp()
      }, { merge: true });
      this.successMessage = "Syllabus saved successfully.";
      this.isEditingSyllabus = false;
    } catch (error) {
      console.error("Error saving syllabus:", error);
      this.errorMessage = "Failed to save syllabus.";
    }
  }

  toggleEditSyllabus(isEditing: boolean) {
    this.isEditingSyllabus = isEditing;
    this.successMessage = null;
    this.errorMessage = null;
  }

  async deleteSyllabusContent() {
    if (!this.schoolId || !this.selectedClassForSyllabus || !this.selectedSubjectForSyllabus || !confirm("Are you sure you want to delete the syllabus for this subject?")) return;
    const syllabusId = `${this.selectedClassForSyllabus}_${this.selectedSubjectForSyllabus}`;
    const syllabusDocRef = doc(this.firestore, `schools/${this.schoolId}/syllabus/${syllabusId}`);
    try {
      await deleteDoc(syllabusDocRef);
      this.successMessage = "Syllabus content deleted.";
    } catch (error) {
      this.errorMessage = "Failed to delete syllabus content.";
    }
  }

  // --- About School Management ---
  async loadAboutSchoolContent() {
    if (!this.schoolId) return;
    this.isLoadingAboutSchool = true;
    const aboutDocRef = doc(this.firestore, `schools/${this.schoolId}/about_school/main`);

    onSnapshot(aboutDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.aboutSchoolContent = data['content'];
        this.aboutSchoolForm.patchValue({ content: this.aboutSchoolContent });
      } else {
        this.aboutSchoolContent = null;
        this.aboutSchoolForm.reset();
      }
      this.isLoadingAboutSchool = false;
    }, (error) => {
      console.error("Error loading about school content:", error);
      this.errorMessage = "Failed to load 'About Us' content.";
      this.isLoadingAboutSchool = false;
    });
  }

  async onAboutSchoolSubmit() {
    if (this.aboutSchoolForm.invalid || !this.schoolId) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;

    const { content } = this.aboutSchoolForm.value;
    const aboutDocRef = doc(this.firestore, `schools/${this.schoolId}/about_school/main`);

    try {
      // Use setDoc with merge:true to create or update the document.
      await setDoc(aboutDocRef, {
        content,
        updatedAt: serverTimestamp()
      }, { merge: true });

      this.successMessage = "'About Us' content saved successfully.";
      this.isEditingAboutSchool = false;
    } catch (error) {
      console.error("Error saving 'About Us' content:", error);
      this.errorMessage = "Failed to save 'About Us' content.";
    }
  }

  toggleEditAboutSchool(isEditing: boolean) {
    this.isEditingAboutSchool = isEditing;
    this.successMessage = null;
    this.errorMessage = null;
  }

  async deleteAboutSchoolContent() {
    if (!this.schoolId || !confirm("Are you sure you want to delete the 'About Us' content? This action cannot be undone.")) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    const aboutDocRef = doc(this.firestore, `schools/${this.schoolId}/about_school/main`);

    try {
      await deleteDoc(aboutDocRef);
      this.successMessage = "'About Us' content has been deleted.";
    } catch (error) {
      console.error("Error deleting 'About Us' content:", error);
      this.errorMessage = "Failed to delete 'About Us' content.";
    }
  }

  // --- Our Courses Management ---
  async loadCoursesInfoContent() {
    if (!this.schoolId) return;
    this.isLoadingCoursesInfo = true;
    const coursesInfoDocRef = doc(this.firestore, `schools/${this.schoolId}/courses_info/main`);

    onSnapshot(coursesInfoDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.coursesInfoContent = data['content'];
        this.coursesInfoForm.patchValue({ content: this.coursesInfoContent });
      } else {
        this.coursesInfoContent = null;
        this.coursesInfoForm.reset();
      }
      this.isLoadingCoursesInfo = false;
    }, (error) => {
      console.error("Error loading 'Our Courses' content:", error);
      this.errorMessage = "Failed to load 'Our Courses' content.";
      this.isLoadingCoursesInfo = false;
    });
  }

  async onCoursesInfoSubmit() {
    if (this.coursesInfoForm.invalid || !this.schoolId) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;

    const { content } = this.coursesInfoForm.value;
    const coursesInfoDocRef = doc(this.firestore, `schools/${this.schoolId}/courses_info/main`);

    try {
      await setDoc(coursesInfoDocRef, {
        content,
        updatedAt: serverTimestamp()
      }, { merge: true });

      this.successMessage = "'Our Courses' content saved successfully.";
      this.isEditingCoursesInfo = false;
    } catch (error) {
      console.error("Error saving 'Our Courses' content:", error);
      this.errorMessage = "Failed to save 'Our Courses' content.";
    }
  }

  toggleEditCoursesInfo(isEditing: boolean) {
    this.isEditingCoursesInfo = isEditing;
    this.successMessage = null;
    this.errorMessage = null;
  }

  async deleteCoursesInfoContent() {
    if (!this.schoolId || !confirm("Are you sure you want to delete the 'Our Courses' content? This action cannot be undone.")) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;
    const coursesInfoDocRef = doc(this.firestore, `schools/${this.schoolId}/courses_info/main`);
    try {
      await deleteDoc(coursesInfoDocRef);
      this.successMessage = "'Our Courses' content has been deleted.";
    } catch (error) {
      console.error("Error deleting 'Our Courses' content:", error);
      this.errorMessage = "Failed to delete 'Our Courses' content.";
    }
  }

  // --- Our Curriculum Management ---
  async loadCurriculumInfoContent() {
    if (!this.schoolId) return;
    this.isLoadingCurriculumInfo = true;
    const curriculumInfoDocRef = doc(this.firestore, `schools/${this.schoolId}/our_curriculum/main`);

    onSnapshot(curriculumInfoDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.curriculumInfoContent = data['content'];
        this.curriculumInfoForm.patchValue({ content: this.curriculumInfoContent });
      } else {
        this.curriculumInfoContent = null;
        this.curriculumInfoForm.reset();
      }
      this.isLoadingCurriculumInfo = false;
    }, (error) => {
      console.error("Error loading 'Our Curriculum' content:", error);
      this.errorMessage = "Failed to load 'Our Curriculum' content.";
      this.isLoadingCurriculumInfo = false;
    });
  }

  async onCurriculumInfoSubmit() {
    if (this.curriculumInfoForm.invalid || !this.schoolId) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;

    const { content } = this.curriculumInfoForm.value;
    const curriculumInfoDocRef = doc(this.firestore, `schools/${this.schoolId}/our_curriculum/main`);

    try {
      await setDoc(curriculumInfoDocRef, {
        content,
        updatedAt: serverTimestamp()
      }, { merge: true });

      this.successMessage = "'Our Curriculum' content saved successfully.";
      this.isEditingCurriculumInfo = false;
    } catch (error) {
      console.error("Error saving 'Our Curriculum' content:", error);
      this.errorMessage = "Failed to save 'Our Curriculum' content.";
    }
  }

  toggleEditCurriculumInfo(isEditing: boolean) {
    this.isEditingCurriculumInfo = isEditing;
    this.successMessage = null;
    this.errorMessage = null;
  }

  async deleteCurriculumInfoContent() {
    if (!this.schoolId || !confirm("Are you sure you want to delete the 'Our Curriculum' content? This action cannot be undone.")) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;
    const curriculumInfoDocRef = doc(this.firestore, `schools/${this.schoolId}/our_curriculum/main`);
    try {
      await deleteDoc(curriculumInfoDocRef);
      this.successMessage = "'Our Curriculum' content has been deleted.";
    } catch (error) {
      console.error("Error deleting 'Our Curriculum' content:", error);
      this.errorMessage = "Failed to delete 'Our Curriculum' content.";
    }
  }

  // --- Our Facilities Management ---
  async loadFacilitiesInfoContent() {
    if (!this.schoolId) return;
    this.isLoadingFacilitiesInfo = true;
    const facilitiesInfoDocRef = doc(this.firestore, `schools/${this.schoolId}/facilities/main`);

    onSnapshot(facilitiesInfoDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.facilitiesInfoContent = data['content'];
        this.facilitiesInfoForm.patchValue({ content: this.facilitiesInfoContent });
      } else {
        this.facilitiesInfoContent = null;
        this.facilitiesInfoForm.reset();
      }
      this.isLoadingFacilitiesInfo = false;
    }, (error) => {
      console.error("Error loading 'Our Facilities' content:", error);
      this.errorMessage = "Failed to load 'Our Facilities' content.";
      this.isLoadingFacilitiesInfo = false;
    });
  }

  async onFacilitiesInfoSubmit() {
    if (this.facilitiesInfoForm.invalid || !this.schoolId) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;

    const { content } = this.facilitiesInfoForm.value;
    const facilitiesInfoDocRef = doc(this.firestore, `schools/${this.schoolId}/facilities/main`);

    try {
      await setDoc(facilitiesInfoDocRef, {
        content,
        updatedAt: serverTimestamp()
      }, { merge: true });

      this.successMessage = "'Our Facilities' content saved successfully.";
      this.isEditingFacilitiesInfo = false;
    } catch (error) {
      console.error("Error saving 'Our Facilities' content:", error);
      this.errorMessage = "Failed to save 'Our Facilities' content.";
    }
  }

  toggleEditFacilitiesInfo(isEditing: boolean) {
    this.isEditingFacilitiesInfo = isEditing;
    this.successMessage = null;
    this.errorMessage = null;
  }

  async deleteFacilitiesInfoContent() {
    if (!this.schoolId || !confirm("Are you sure you want to delete the 'Our Facilities' content? This action cannot be undone.")) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;
    const facilitiesInfoDocRef = doc(this.firestore, `schools/${this.schoolId}/facilities/main`);
    try {
      await deleteDoc(facilitiesInfoDocRef);
      this.successMessage = "'Our Facilities' content has been deleted.";
    } catch (error) {
      console.error("Error deleting 'Our Facilities' content:", error);
      this.errorMessage = "Failed to delete 'Our Facilities' content.";
    }
  }

  // --- School Details Management ---
  async loadSchoolDetails() {
    if (!this.schoolId) return;
    this.isLoadingSchoolDetails = true;
    const schoolDocRef = doc(this.firestore, `schools/${this.schoolId}`);

    onSnapshot(schoolDocRef, (docSnap) => {
      if (docSnap.exists()) {
        this.schoolData = docSnap.data();
        // Set map center and marker position from loaded data
        const lat = parseFloat(this.schoolData.latitude);
        const lng = parseFloat(this.schoolData.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          this.mapOptions = { ...this.mapOptions, center: { lat, lng }, zoom: 15 };
          this.markerPosition = { lat, lng };
        } else {
          this.markerPosition = null;
        }

        this.schoolDetailsForm.patchValue(this.schoolData);
        this.schoolDetailsForm.disable();
      } else {
        this.schoolData = null;
        this.errorMessage = "School details not found.";
      }
      this.isLoadingSchoolDetails = false;
    }, (error) => {
      console.error("Error loading school details:", error);
      this.errorMessage = "Failed to load school details.";
      this.isLoadingSchoolDetails = false;
    });
  }

  toggleEditSchoolDetails(isEditing: boolean) {
    this.isEditingSchoolDetails = isEditing;
    if (isEditing) {
      this.schoolDetailsForm.enable();
      // If no marker is set when editing starts, center on the default location
      if (!this.markerPosition) {
        this.mapOptions = { ...this.mapOptions, center: { lat: 20.5937, lng: 78.9629 }, zoom: 5 };
      }
    } else {
      this.schoolDetailsForm.disable();
      // Reset to original data if cancel is clicked
      if (this.schoolData) {
        this.schoolDetailsForm.patchValue(this.schoolData);
        const lat = parseFloat(this.schoolData.latitude);
        const lng = parseFloat(this.schoolData.longitude);
        this.markerPosition = (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
        this.mapOptions = { ...this.mapOptions, center: this.markerPosition ?? { lat: 20.5937, lng: 78.9629 } };
      }
    }
    this.successMessage = null;
    this.errorMessage = null;
  }

  async onSchoolDetailsSubmit() {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.schoolDetailsForm.invalid || !this.schoolId) {
      return;
    }

    const slug = this.schoolDetailsForm.get('slug')?.value;
    if (slug) {
      const q = query(collection(this.firestore, 'schools'), where('slug', '==', slug));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let slugIsTaken = false;
        querySnapshot.forEach(doc => {
          if (doc.id !== this.schoolId) {
            slugIsTaken = true;
          }
        });

        if (slugIsTaken) {
          this.errorMessage = `The weblink (slug) "${slug}" is already in use. Please choose a unique one.`;
          return;
        }
      }
    }

    const schoolDocRef = doc(this.firestore, `schools/${this.schoolId}`);
    try {
      await updateDoc(schoolDocRef, this.schoolDetailsForm.value);
      this.successMessage = "School details updated successfully.";
      this.schoolDetailsForm.disable();
      this.isEditingSchoolDetails = false;
    } catch (error) {
      console.error("Error updating school details:", error);
      this.errorMessage = "Failed to update school details.";
      this.toggleEditSchoolDetails(true); // Re-enable form on error
    }
  }

  onMapClick(event: { latLng: google.maps.LatLng | null | undefined } | google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.ngZone.run(() => {
        const position = event.latLng!.toJSON();
        this.markerPosition = position;
        if (this.isEditingSchoolDetails) {
          this.updateMarkerAndForm(position);
        } else if (this.map) {
          this.map.panTo(position);
          this.map.zoom = 15;
        }
      })
    }
  }

  private updateMarkerAndForm(position: google.maps.LatLngLiteral) {
    this.markerPosition = position;

    if (this.map) {
      this.map.panTo(position);
      this.map.zoom = 15;
    }

    // Update lat/lng immediately
    this.schoolDetailsForm.patchValue({
      latitude: position.lat,
      longitude: position.lng
    });

    // Perform reverse geocoding to get address details
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: position }, (results, status) => {
      this.ngZone.run(() => {
        if (status === 'OK' && results && results[0]) {
          const addressComponents = results[0].address_components;
          const getAddressComponent = (type: string) =>
            addressComponents.find(c => c.types.includes(type))?.long_name || '';

          const addressData = {
            address: results[0].formatted_address,
            country: getAddressComponent('country'),
            state: getAddressComponent('administrative_area_level_1'),
            city: getAddressComponent('locality') || getAddressComponent('administrative_area_level_2'),
            zip_code: getAddressComponent('postal_code')
          };

          this.schoolDetailsForm.patchValue(addressData);
        } else {
          console.warn('Reverse geocode was not successful for the following reason: ' + status);
        }
      });
    });
  }
}
/*
export class Master implements OnInit {
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private schoolState = inject(SchoolStateService);

  classForm: FormGroup;
  classes: any[] = [];
  schoolId: string | null = null;
  isLoading = true;
  isEditing = false;
  currentClassId: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor() {
    this.classForm = this.fb.group({
      className: ['', Validators.required],
      section: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // First, try to get schoolId from the route params
    this.route.queryParamMap.subscribe(params => {
      this.schoolId = params.get('schoolId');
      if (this.schoolId) {
        this.schoolState.setSchoolId(this.schoolId);
        this.loadClasses();
      } else {
        this.errorMessage = "School ID not found in URL. Please ensure you are navigating from the dashboard.";
        this.isLoading = false;
      }
    });
  }

  async loadClasses() {
    if (!this.schoolId) return;
    this.isLoading = true;
    const classesCollection = collection(this.firestore, `schools/${this.schoolId}/classes`);
    const q = query(classesCollection, orderBy('className'), orderBy('section'));
    onSnapshot(q, (querySnapshot) => {
      this.classes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.isLoading = false;
    }, (error) => {
      console.error("Error loading classes:", error);
      this.errorMessage = "Failed to load classes.";
      this.isLoading = false;
    });
  }

  async onSubmit() {
    if (this.classForm.invalid || !this.schoolId) {
      return;
    }

    try {
      if (this.isEditing && this.currentClassId) {
        const classDocRef = doc(this.firestore, `schools/${this.schoolId}/classes/${this.currentClassId}`);
        await updateDoc(classDocRef, { ...this.classForm.value, updatedAt: serverTimestamp() });
        this.successMessage = "Class updated successfully.";
      } else {
        const classesCollection = collection(this.firestore, `schools/${this.schoolId}/classes`);
        await addDoc(classesCollection, { ...this.classForm.value, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        this.successMessage = "Class added successfully.";
      }
      this.resetForm();
    } catch (error) {
      console.error("Error saving class:", error);
      this.errorMessage = "Failed to save class.";
    }
  }

  editClass(classItem: any) {
    this.isEditing = true;
    this.currentClassId = classItem.id;
    this.classForm.setValue({
      className: classItem.className,
      section: classItem.section
    });
  }

  async deleteClass(classId: string) {
    if (!this.schoolId || !confirm('Are you sure you want to delete this class?')) return;
    const classDocRef = doc(this.firestore, `schools/${this.schoolId}/classes/${classId}`);
    try {
      await deleteDoc(classDocRef);
      this.successMessage = "Class deleted successfully.";
    } catch (error) {
      console.error("Error deleting class:", error);
      this.errorMessage = "Failed to delete class.";
    }
  }

  resetForm() {
    this.isEditing = false;
    this.currentClassId = null;
    this.classForm.reset();
    this.successMessage = null;
    this.errorMessage = null;
  }
}
*/
