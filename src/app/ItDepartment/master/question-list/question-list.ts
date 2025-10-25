import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, collectionGroup, query, where, getDocs, doc, updateDoc, getDoc, deleteDoc, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';

interface Question {
  id: string;
  question: string;
  subject: string;
  class: string;
  chapter: string;
  teacherName?: string;
  status?: string;
  teacherId: string;
  docRef: any; // To hold the original document reference
}

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-list.html',
})
export class QuestionListComponent implements OnInit {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);

  schoolId: string | null = null;
  questions: Question[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  filter = 'pending'; // 'all', 'pending', 'approved'

  teacherFilter = 'all'; // 'all' or a teacherId
  teachers: { id: string, name: string }[] = [];

  // Pagination state
  lastVisible: QueryDocumentSnapshot<DocumentData> | undefined = undefined;
  private questionsPerPage = 15; // Adjust page size as needed
  page = 1;
  private pageCursors: (QueryDocumentSnapshot<DocumentData> | null)[] = [null]; // Cursors for startAfter
  hasNextPage = false;

  private allQuestions: Question[] = []; // Store all loaded questions before filtering
  private teacherCache = new Map<string, string>();

  ngOnInit(): void {
    this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    if (this.schoolId) {
      this.loadQuestions();
    } else {
      this.errorMessage = "School ID not found in URL.";
      this.isLoading = false;
    }
  }

  async loadQuestions(): Promise<void> {
    if (!this.schoolId) return;
    this.isLoading = true;
    this.page = 1;
    this.pageCursors = [null];
    this.lastVisible = undefined;
    this.allQuestions = [];
    this.questions = [];
    this.teachers = [];
    this.errorMessage = null;
    await this.fetchPage(this.page);
  }

  private async fetchPage(pageNumber: number): Promise<void> {
    if (!this.schoolId) return;
    this.isLoading = true;
    this.errorMessage = null;

    const cursor = this.pageCursors[pageNumber - 1];

    const qbCollection = collectionGroup(this.firestore, 'question_bank');
    let q = query(qbCollection, where('schoolId', '==', this.schoolId), orderBy('question'), limit(this.questionsPerPage + 1));

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    try {
      const querySnapshot = await getDocs(q);

      this.hasNextPage = querySnapshot.docs.length > this.questionsPerPage;
      const docs = this.hasNextPage ? querySnapshot.docs.slice(0, -1) : querySnapshot.docs;
      this.lastVisible = docs[docs.length - 1];

      if (this.hasNextPage && this.pageCursors.length === pageNumber) {
        this.pageCursors.push(this.lastVisible);
      }

      const newQuestions = docs.map(questionDoc => {
        const data = questionDoc.data();
        const teacherId = questionDoc.ref.parent.parent?.id || 'unknown';
        return { id: questionDoc.id, docRef: questionDoc.ref, teacherId, ...data } as Question;
      });

      // Get unique teacher IDs that are not already in the cache
      const teacherIdsToFetch = [...new Set(newQuestions.map(ques => ques.teacherId))]
        .filter(id => id !== 'unknown' && !this.teacherCache.has(id));

      // Fetch missing teacher names in a single query if there are any
      if (teacherIdsToFetch.length > 0) {
        // Firestore 'in' queries are limited to 30 items. We need to batch them.
        for (let i = 0; i < teacherIdsToFetch.length; i += 30) {
          const batch = teacherIdsToFetch.slice(i, i + 30);
          const teachersCollection = collection(this.firestore, `schools/${this.schoolId}/teachers`);
          const teacherQuery = query(teachersCollection, where('__name__', 'in', batch));
          const teachersSnapshot = await getDocs(teacherQuery);

          teachersSnapshot.forEach(teacherDoc => {
            const teacherData = teacherDoc.data();
            if (teacherData && teacherData['name']) {
              this.teacherCache.set(teacherDoc.id, teacherData['name']);
            }
          });
        }
      }

      // Map teacher names to new questions
      newQuestions.forEach(question => {
        question.teacherName = this.teacherCache.get(question.teacherId) || 'Unknown Teacher';
      });

      this.allQuestions = newQuestions; // Replace instead of push
      this.applyFilters(); // This will set this.questions
      this.updateTeacherList();
    } catch (error) {
      console.error("Error fetching questions:", error);
      this.errorMessage = "Failed to load questions. Please check Firestore security rules and indexes.";
    } finally {
      this.isLoading = false;
    }
  }

  async nextPage(): Promise<void> {
    this.page++;
    await this.fetchPage(this.page);
  }

  async prevPage(): Promise<void> {
    this.page--;
    await this.fetchPage(this.page);
  }

  applyFilters(): void {
    let filtered = this.allQuestions;

    if (this.teacherFilter !== 'all') {
      filtered = filtered.filter(q => q.teacherId === this.teacherFilter);
    }

    this.questions = filtered;
  }

  updateTeacherList(): void {
    const uniqueTeachers = new Map<string, string>();
    this.allQuestions.forEach(q => {
      if (q.teacherId !== 'unknown' && q.teacherName) {
        uniqueTeachers.set(q.teacherId, q.teacherName);
      }
    });
    this.teachers = Array.from(uniqueTeachers, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async approveQuestion(question: Question): Promise<void> {
    if (question.status === 'approved') return;
    await updateDoc(question.docRef, { status: 'approved' });
    question.status = 'approved';
  }

  async deleteQuestion(question: Question): Promise<void> {
    if (!confirm(`Are you sure you want to delete the question: "${question.question}"?`)) {
      return;
    }

    try {
      await deleteDoc(question.docRef);
      this.allQuestions = this.allQuestions.filter(q => q.id !== question.id); // Update master list
      this.applyFilters(); // Re-apply filters to update the view
    } catch (error) {
      console.error("Error deleting question:", error);
      this.errorMessage = "Failed to delete the question. Please try again.";
    }
  }
}