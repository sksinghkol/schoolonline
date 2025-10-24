import { Component, OnInit, Pipe, PipeTransform, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Firestore, collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, orderBy, collectionGroup } from '@angular/fire/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SchoolStateService } from '../../core/services/school-state.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';

// A simple pipe to stringify an object for checkbox values.
@Pipe({ name: 'jsonParse', standalone: true })
export class JsonParsePipe implements PipeTransform {
  transform(value: string, obj: any): string {
    return JSON.stringify(obj);
  }
}

// A pipe to convert an index to a character, e.g., 0 -> 'a', 1 -> 'b'.
@Pipe({ name: 'character', standalone: true })
export class CharacterPipe implements PipeTransform {
  transform(value: string, index: number): string {
    return String.fromCharCode(value.charCodeAt(0) + index);
  }
}

@Component({
  selector: 'app-texam-question',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, JsonParsePipe, CharacterPipe],
  templateUrl: './texam-question.html',
  styleUrl: './texam-question.scss'
})
export class TexamQuestion implements OnInit {
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private schoolState = inject(SchoolStateService);

  examDetailsForm: FormGroup;
  questionPaperForm: FormGroup;

  // State Management
  isCreatingExam = false;
  isLoadingExams = true;
  isLoadingQuestions = false;
  isSaving = false;
  examCreated = false; // New state to control UI flow
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Data
  schoolId: string | null = null;
  teacherId: string | null = null;
  questions: any[] = [];
  existingExams: any[] = [];
  classes$!: Observable<string[]>;
  subjects: string[] = ['Mathematics', 'Science', 'English', 'History', 'Geography']; // Example data
  examTypes: string[] = ['Unit Test', 'Mid-Term Exam', 'Final Exam', 'Class Test'];

  constructor() {
    this.examDetailsForm = this.fb.group({
      class: ['', Validators.required],
      subject: ['', Validators.required],
      examType: ['', Validators.required],
      examDate: ['', Validators.required],
      totalMarks: ['', [Validators.required, Validators.min(1)]],
      duration: ['', Validators.required],
      id: [null] // To store the ID of an existing or newly created exam
    });

    this.questionPaperForm = this.fb.group({
      selectedQuestions: this.fb.array([], [Validators.required])
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.schoolId = params.get('schoolId');
      this.teacherId = params.get('teacherId');

      if (!this.schoolId || !this.teacherId) {
        this.errorMessage = "Could not identify school or teacher from the URL. Please try navigating again.";
        this.isLoadingExams = false;
        return;
      }
      this.loadClasses();
      this.loadExistingExams();
    });
  }

  loadClasses() {
    if (!this.schoolId) {
      this.classes$ = of([]);
      return;
    }
    const classesCollection = collection(this.firestore, `schools/${this.schoolId}/classes`);
    const q = query(classesCollection, orderBy('className'));
    this.classes$ = from(getDocs(q)).pipe(
      map(snapshot => [...new Set(snapshot.docs.map(doc => doc.data()['className'] as string))])
    );
  }

  async loadExistingExams() {
    if (!this.schoolId || !this.teacherId) return;
    this.isLoadingExams = true;
    const examsCollection = collection(this.firestore, `schools/${this.schoolId}/exams`);
    // Fetch exams created by this teacher that are still pending questions
    const q = query(
      examsCollection,
      where('teacherId', '==', this.teacherId),
      where('status', 'in', ['Pending Questions', 'approved']),
      orderBy('createdAt', 'desc')
    );
    try {
      const querySnapshot = await getDocs(q);
      this.existingExams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching existing exams:", error);
      this.errorMessage = "Could not load existing exams.";
    } finally {
      this.isLoadingExams = false;
    }
  }

  async createExamAndFetchQuestions() {
    this.examDetailsForm.markAllAsTouched();
    if (this.examDetailsForm.invalid || !this.schoolId || !this.teacherId) {
      this.errorMessage = "Please fill all exam details before proceeding.";
      return;
    }

    this.isCreatingExam = true;
    this.errorMessage = null;
    this.successMessage = null;

    const examData = {
      ...this.examDetailsForm.value,
      teacherId: this.teacherId,
      schoolId: this.schoolId,
      createdAt: serverTimestamp(),
      status: 'Pending Questions' // Initial status
    };

    try {
      const examsCollection = collection(this.firestore, `schools/${this.schoolId}/exams`);
      const docRef = await addDoc(examsCollection, examData);
      this.examCreated = true; // Unlock the next step in the UI
      this.examDetailsForm.patchValue({ id: docRef.id });
      this.successMessage = `Exam created successfully (ID: ${docRef.id}). Now, please select questions.`;
      this.examDetailsForm.disable(); // Prevent further edits
      await this.fetchQuestions(); // Automatically fetch questions
    } catch (error) {
      console.error("Error creating exam:", error);
      this.errorMessage = "Failed to create the exam. Please try again.";
    } finally {
      this.isCreatingExam = false;
    }
  }

  async selectExistingExam(exam: any) {
    this.successMessage = `Selected exam for Class ${exam.class} - ${exam.subject}. Now select questions.`;
    this.errorMessage = null;

    // Populate and disable the form
    this.examDetailsForm.patchValue(exam);
    this.examDetailsForm.disable();

    // Unlock the question selection step
    this.examCreated = true;

    // Fetch questions for the selected exam
    await this.fetchQuestions();
  }

  private async fetchQuestions() {
    if (!this.schoolId || !this.teacherId) return;

    this.isLoadingQuestions = true;
    this.questions = [];
    (this.questionPaperForm.get('selectedQuestions') as FormArray).clear();

    const { class: qClass, subject } = this.examDetailsForm.value;
    const qbCollection = collectionGroup(this.firestore, `question_bank`);
    const q = query(
      qbCollection,
      where('schoolId', '==', this.schoolId),
      where('questionClass', '==', qClass),
      where('subject', '==', subject)
    );

    try {
      const querySnapshot = await getDocs(q);
      this.questions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (this.questions.length === 0) {
        this.errorMessage = "Exam created, but no questions were found in your bank for the selected class and subject.";
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      this.errorMessage = "Failed to fetch questions. Please try again.";
    } finally {
      this.isLoadingQuestions = false;
    }
  }

  onQuestionChange(event: Event) {
    const selectedQuestions = this.questionPaperForm.controls['selectedQuestions'] as FormArray;
    const input = event.target as HTMLInputElement;
    try {
      const question = JSON.parse(input.value);
      if (input.checked) {
        selectedQuestions.push(this.fb.control(question));
      } else {
        const index = selectedQuestions.controls.findIndex(x => x.value.id === question.id);
        if (index !== -1) {
          selectedQuestions.removeAt(index);
        }
      }
    } catch (e) {
      console.error('Error parsing question data from checkbox value', e);
      this.errorMessage = 'An error occurred while selecting a question.';
    }
  }

  async saveQuestionPaper() {
    this.questionPaperForm.markAllAsTouched();
    if (this.questionPaperForm.invalid || !this.schoolId || !this.teacherId) {
      this.errorMessage = "Please select at least one question.";
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    // The data to be saved in the teacher's question_papers subcollection
    const paperData = {
      examId: this.examDetailsForm.get('id')?.value, // Link to the exam document
      selectedQuestions: this.questionPaperForm.value.selectedQuestions,
      teacherId: this.teacherId,
      schoolId: this.schoolId,
      class: this.examDetailsForm.value.class,
      subject: this.examDetailsForm.value.subject,
      createdAt: serverTimestamp(),
      status: 'Finalized'
    };

    const qpCollection = collection(this.firestore, `schools/${this.schoolId}/teachers/${this.teacherId}/question_papers`);

    try {
      // Save the question paper
      const docRef = await addDoc(qpCollection, paperData);

      // Update the original exam document status
      const examDocRef = doc(this.firestore, `schools/${this.schoolId}/exams/${this.examDetailsForm.get('id')?.value}`);
      await updateDoc(examDocRef, { status: 'Finalized', questionPaperId: docRef.id });

      this.successMessage = `Question paper has been finalized and saved successfully!`;
      this.existingExams = this.existingExams.filter(exam => exam.id !== this.examDetailsForm.get('id')?.value); // Remove from pending list
      this.questionPaperForm.disable(); // Lock the form after saving

      // Automatically trigger PDF download after successful save
      this.generatePdf();
    } catch (error) {
      console.error("Error saving question paper:", error);
      this.errorMessage = "Failed to save the question paper. Please try again.";
    } finally {
      this.isSaving = false;
      // This will make the UI feel instantly responsive.
      (this.questionPaperForm.get('selectedQuestions') as FormArray).disable();
    }
  }

  generatePdf() {
    if (this.questionPaperForm.invalid) {
      this.errorMessage = "Cannot generate PDF. Please ensure all details are correct and the paper is saved.";
      return;
    }

    const doc = new jsPDF();
    const examDetails = this.examDetailsForm.getRawValue();
    const questions = this.questionPaperForm.getRawValue().selectedQuestions;
    const school = this.schoolState.currentSchool();

    // Header
    doc.setFontSize(18);
    doc.text(school?.name || 'School Name', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`${examDetails.examType} - ${examDetails.subject}`, 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Class: ${examDetails.class}`, 20, 40);
    doc.text(`Total Marks: ${examDetails.totalMarks}`, 105, 40, { align: 'center' });
    doc.text(`Duration: ${examDetails.duration}`, 190, 40, { align: 'right' });
    doc.line(20, 45, 190, 45);

    // Questions
    let y = 60;
    questions.forEach((q: any, index: number) => {
      if (y > 270) { // Check for page break
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${q.question}`, 20, y);
      y += 7;

      if (q.options && q.options.length > 0) {
        doc.setFontSize(10);
        q.options.forEach((opt: string, i: number) => {
          doc.text(`   (${String.fromCharCode(97 + i)}) ${opt}`, 25, y);
          y += 6;
        });
      }
      y += 5; // Space between questions
    });

    // Save the PDF
    doc.save(`${examDetails.class}_${examDetails.subject}_${examDetails.examType}.pdf`);
  }
}
