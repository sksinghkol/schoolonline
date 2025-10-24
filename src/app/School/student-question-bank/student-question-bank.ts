import { Component, inject, effect, computed, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule, } from '@angular/router';
import { Firestore, collectionGroup, query, where, getDocs, doc, getDoc, DocumentData, orderBy, QueryConstraint, limit, startAfter, getCountFromServer, collection, Query } from '@angular/fire/firestore';
import { SchoolStateService } from '../../core/services/school-state.service';

interface Question extends DocumentData {
  id: string;
  question: string;
  subject: string;
  chapter: string;
  questionClass: string;
  questionType: string;
  teacherId: string;
  options?: string[];
  teacherName?: string; // To be populated
  createdAt: any;
}

@Component({
  selector: 'app-school-question-bank',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-question-bank.html',
  styleUrls: ['./student-question-bank.scss']
})
export class StudentQuestionBankComponent {
  private firestore = inject(Firestore);
  private router = inject(Router); // Not used in this component, but kept for consistency
  private route = inject(ActivatedRoute); // To potentially read initial filter params from URL
  public schoolState = inject(SchoolStateService);
  private destroyRef = inject(DestroyRef);

  schoolId = computed(() => this.schoolState.currentSchool()?.id);
  approvedQuestions = signal<Question[]>([]);
  isLoading = signal(true);
  isLoadingFilters = signal(true);
  error = signal<string | null>(null);

  // Filter signals
  selectedType = signal<string | null>(null);
  selectedClass = signal<string | null>(null);
  selectedChapter = signal<string | null>(null);
  selectedSubject = signal<string | null>(null);
  selectedTeacher = signal<string | null>(null); // New signal for teacher filter

  // Pagination signals
  pageSize = 25;
  currentPage = signal(1);
  lastDoc = signal<DocumentData | null>(null);
  isLastPage = signal(false);
  totalQuestions = signal(0);

  // For storing snapshots for previous pages
  private pageStartSnapshots: (DocumentData | null)[] = [null];

  // Signals for filter dropdown options
  allApprovedQuestions = signal<Question[]>([]);
  availableClasses = computed(() => this.getUniqueValuesFor('questionClass', this.allApprovedQuestions()));
  availableSubjects = computed(() => this.getUniqueValuesFor('subject', this.allApprovedQuestions()));
  availableChapters = computed(() => this.getUniqueValuesFor('chapter', this.allApprovedQuestions()));
  availableTeachers = computed(() => this.getUniqueValuesFor('teacherName', this.allApprovedQuestionsWithTeachers())); // Use questions with teacher names
  allApprovedQuestionsWithTeachers = signal<Question[]>([]);

  // Signals for question counts by category
  questionCountBySubject = computed(() => this.getCountsFor('subject'));
  questionCountByChapter = computed(() => this.getCountsFor('chapter'));
  questionCountByType = computed(() => this.getCountsFor('questionType'));
  questionCountByTeacher = computed(() => this.getCountsFor('teacherName'));

  // Available question types (consistent with TeacherQuestionbank)
  questionTypes = [
    'All Types', // Option to show all types
    'Multiple Choice', 'True/False', 'Matching', 'Fill in the Blanks',
    'Multiple Response', 'Short Answer', 'Essay/Long Answer', 'Problem-Solving',
    'Case Study', 'Ranking/Ordering', 'Scenario-Based'
  ];

  private teacherCache = new Map<string, string>();

  constructor() {
    // Effect to load all questions once for populating filters
    effect(() => {
      const currentSchoolId = this.schoolId();
      if (currentSchoolId) this.loadAllQuestionsForFilters(currentSchoolId);
    }, { allowSignalWrites: true });
    // Effect to load questions whenever schoolId or filter signals change
    effect(() => {
      const currentSchoolId = this.schoolId();
      const type = this.selectedType();
      const qClass = this.selectedClass();
      const chapter = this.selectedChapter();
      const subject = this.selectedSubject();
      const teacher = this.selectedTeacher(); // Get selected teacher
      
      if (currentSchoolId) { // Only load if schoolId is available
        this.loadApprovedQuestions(currentSchoolId, type, qClass, chapter, subject, teacher, 'first');
      } else {
        // If the school state is not yet loaded, we might need to wait.
        // A small delay can help if the parent route is still resolving the school.
        setTimeout(() => {
          if (!this.schoolState.currentSchool()) {
            this.error.set("Could not identify the school. Please ensure you are accessing this page correctly.");
            this.isLoading.set(false);
          }
        }, 2500);
      }
    });
  }

  private getUniqueValuesFor(field: keyof Question, sourceArray: Question[]): string[] {
    const values = sourceArray.map(q => q[field]);
    return ['All', ...[...new Set(values)].filter(Boolean).sort()];
  }

  async loadAllQuestionsForFilters(schoolId: string): Promise<void> {
    this.isLoadingFilters.set(true);
    try {
      const questionBankGroup = collectionGroup(this.firestore, 'question_bank');
      const q = query(
        questionBankGroup,
        where('schoolId', '==', schoolId),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);
      const questions = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Question));

      // Fetch all teacher names for the statistics
      const uniqueTeacherIds = new Set<string>();
      questions.forEach(q => {
        if (q.teacherId) uniqueTeacherIds.add(q.teacherId);
      });

      const teacherPromises: Promise<void>[] = [];
      for (const teacherId of uniqueTeacherIds) {
        if (!this.teacherCache.has(teacherId)) {
          const teacherDocRef = doc(this.firestore, `schools/${schoolId}/teachers/${teacherId}`);
          teacherPromises.push(
            getDoc(teacherDocRef)
              .then(teacherSnap => {
                this.teacherCache.set(teacherId, teacherSnap.data()?.['name'] || 'Unknown Teacher');
              })
              .catch(err => {
                console.warn(`Could not fetch teacher ${teacherId} for stats:`, err);
                this.teacherCache.set(teacherId, 'Unknown Teacher');
              })
          );
        }
      }
      await Promise.all(teacherPromises);

      const questionsWithTeacherNames = questions.map(question => ({
        ...question,
        teacherName: question.teacherId ? this.teacherCache.get(question.teacherId) : 'Unknown Teacher'
      }));

      this.allApprovedQuestionsWithTeachers.set(questionsWithTeacherNames);
      this.allApprovedQuestions.set(questions);
    } catch (err) {
      console.error("Error fetching data for filters:", err);
      this.error.set("Could not load filter options.");
    } finally {
      this.isLoadingFilters.set(false);
    }
  }
  async loadApprovedQuestions(
    schoolId: string,
    type: string | null,
    qClass: string | null,
    chapter: string | null, 
    subject: string | null, 
    teacher: string | null, // New parameter for teacher filter
    direction: 'first' | 'next' | 'prev'
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    if (direction === 'first') this.resetPagination();

    try {
      // Note: This query requires a composite index in Firestore.
      // The error message in the console will provide a link to create it.
      const questionBankGroup = collectionGroup(this.firestore, 'question_bank');
      const queryConstraints: QueryConstraint[] = [
        where('schoolId', '==', schoolId),
        where('status', '==', 'approved')
      ];

      if (type && type !== 'All Types') queryConstraints.push(where('questionType', '==', type));
      if (qClass && qClass !== 'All') queryConstraints.push(where('questionClass', '==', qClass));
      if (chapter && chapter !== 'All') queryConstraints.push(where('chapter', '==', chapter));
      if (subject && subject !== 'All') queryConstraints.push(where('subject', '==', subject));
      if (teacher && teacher !== 'All') queryConstraints.push(where('teacherName', '==', teacher)); // Add teacher filter

      // Get total count for pagination
      if (direction === 'first') {
        const countQuery = query(questionBankGroup, ...queryConstraints);
        const countSnapshot = await getCountFromServer(countQuery);
        this.totalQuestions.set(countSnapshot.data().count);
      }

      // Add ordering and pagination constraints
      queryConstraints.push(orderBy('createdAt', 'desc'));

      let paginatedQuery: Query<DocumentData>;

      switch (direction) {
        case 'next':
          if (this.lastDoc()) {
            queryConstraints.push(startAfter(this.lastDoc()));
          }
          break;
        case 'prev':
          const prevPageStart = this.pageStartSnapshots[this.currentPage() - 2] || null;
          if (prevPageStart) {
            queryConstraints.push(startAfter(prevPageStart));
          }
          break;
      }

      queryConstraints.push(limit(this.pageSize));
      paginatedQuery = query(questionBankGroup, ...queryConstraints);

      const querySnapshot = await getDocs(paginatedQuery);

      this.isLastPage.set(querySnapshot.docs.length < this.pageSize);
      this.lastDoc.set(querySnapshot.docs[querySnapshot.docs.length - 1] || null);

      const questions: Question[] = [];
      const uniqueTeacherIds = new Set<string>();

      // First pass: collect questions and unique teacher IDs
      for (const docSnap of querySnapshot.docs) {
        const question = { id: docSnap.id, ...docSnap.data() } as Question; // Cast to Question interface
        questions.push(question);
        if (question.teacherId) {
          uniqueTeacherIds.add(question.teacherId);
        }
      }

      // Second pass: fetch teacher names in parallel
      const teacherPromises: Promise<void>[] = [];
      for (const teacherId of uniqueTeacherIds) {
        if (!this.teacherCache.has(teacherId)) { // Only fetch if not already in cache
          const teacherDocRef = doc(this.firestore, `schools/${schoolId}/teachers/${teacherId}`);
          teacherPromises.push(
            getDoc(teacherDocRef)
              .then(teacherSnap => {
                this.teacherCache.set(teacherId, teacherSnap.data()?.['name'] || 'Unknown Teacher');
              })
              .catch(err => {
                console.warn(`Could not fetch teacher ${teacherId}:`, err);
                this.teacherCache.set(teacherId, 'Unknown Teacher'); // Fallback
              })
          );
        }
      }
      await Promise.all(teacherPromises);

      // Third pass: assign teacher names to questions
      const questionsWithTeacherNames = questions.map(question => ({
        ...question,
        teacherName: question.teacherId ? this.teacherCache.get(question.teacherId) : 'Unknown Teacher'
      }));

      if (direction === 'next') {
        // Store the starting snapshot for the *next* page, which is the last doc of the current one
        if (this.lastDoc() && !this.pageStartSnapshots[this.currentPage()]) {
           this.pageStartSnapshots.push(this.lastDoc());
        }
      }


      this.approvedQuestions.set(questionsWithTeacherNames);
    } catch (err: any) {
      console.error("Error fetching approved questions:", err);
      // Check for common Firestore index error message
      if (err.code === 'failed-precondition' && err.message.includes('The query requires an index')) {
        this.error.set("This query requires a Firestore index. Please check the browser console for the link.");
      } else {
        this.error.set("Could not load questions. An unexpected error occurred.");
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private getCountsFor(field: keyof Question): Map<string, number> {
    const counts = new Map<string, number>();
    for (const question of this.allApprovedQuestionsWithTeachers()) {
      const key = question[field] as string;
      if (key) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return new Map([...counts.entries()].sort((a, b) => b[1] - a[1])); // Sort by count descending
  }

  goToNextPage(): void {
    if (this.isLastPage()) return;
    this.currentPage.update(page => page + 1);
    const schoolId = this.schoolId();
    if (schoolId) {
      this.loadApprovedQuestions(schoolId, this.selectedType(), this.selectedClass(), this.selectedChapter(), this.selectedSubject(), this.selectedTeacher(), 'next');
    }
  }

  goToPrevPage(): void {
    if (this.currentPage() === 1) return;
    this.currentPage.update(page => page - 1);
    const schoolId = this.schoolId();
    if (schoolId) { 
      this.loadApprovedQuestions(schoolId, this.selectedType(), this.selectedClass(), this.selectedChapter(), this.selectedSubject(), this.selectedTeacher(), 'prev');
    }
  }

  private resetPagination(): void {
    this.currentPage.set(1);
    this.lastDoc.set(null);
    this.pageStartSnapshots = [null];
  }

  // Event handlers for filter changes
  onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedType.set(value === 'All Types' ? null : value);
  }

  onClassChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.selectedClass.set(value === 'All' ? null : value);
  }

  onChapterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.selectedChapter.set(value === 'All' ? null : value);
  }

  onSubjectChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.selectedSubject.set(value === 'All' ? null : value);
  }

  onTeacherChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedTeacher.set(value === 'All' ? null : value);
  }

  clearFilters(): void {
    this.selectedType.set(null);
    this.selectedClass.set(null);
    this.selectedChapter.set(null);
    this.selectedSubject.set(null);
    this.selectedTeacher.set(null); // Clear teacher filter
    // Resetting filters should trigger the effect to reload from the first page
    // The effect already handles this by calling loadApprovedQuestions with 'first' implicitly
    // when filters change.
    this.resetPagination();
  }

  getFillInTheBlanksQuestion(questionText: string): string {
    if (!questionText) {
      return '';
    }
    // Replace ___ with a styled span that looks like a blank input field
    return questionText.replace(/___/g,
      `<span class="fill-blank"></span>`
    );
  }
}