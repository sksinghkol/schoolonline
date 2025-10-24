import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from '@angular/fire/firestore';
import { SchoolStateService } from '../../core/services/school-state.service';

@Component({
  selector: 'app-teacher-questionbank',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-questionbank.html',
  styleUrls: ['./teacher-questionbank.scss']
})
export class TeacherQuestionbank implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  public schoolState = inject(SchoolStateService);
  private cdr = inject(ChangeDetectorRef);

  questionForm: FormGroup;
  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  schoolId: string | null = null;
  teacherId: string | null = null;

  approvedQuestions: any[] = [];
  pendingQuestions: any[] = [];
  isLoadingQuestions = false;
  isLoadingPendingQuestions = false;

  questionTypes = [
    'Multiple Choice', 'True/False', 'Matching', 'Fill in the Blanks',
    'Multiple Response', 'Short Answer', 'Essay/Long Answer', 'Problem-Solving',
    'Case Study', 'Ranking/Ordering', 'Scenario-Based'
  ];

  constructor() {
    this.questionForm = this.fb.group({
      question: ['', Validators.required],
      questionClass: ['', Validators.required],
      subject: ['', Validators.required],
      chapter: ['', Validators.required],
      questionType: ['Multiple Choice', Validators.required],
      options: this.fb.array([]),
      correctAnswer: [null], // Not always required
      correctAnswers: this.fb.array([]),
      matches: this.fb.array([]),
      fillBlanks: this.fb.array([])
    });

    this.onQuestionTypeChange();
  }

  ngOnInit(): void {
    this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    this.teacherId = this.route.snapshot.queryParamMap.get('teacherId');
    this.loadApprovedQuestions();
    this.loadPendingQuestions();
  }

  onQuestionTypeChange(): void {
    this.questionForm.get('questionType')?.valueChanges.subscribe(type => {
      this.updateFormForQuestionType(type);
    });
    // Initial setup
    this.updateFormForQuestionType(this.questionForm.get('questionType')?.value);
  }

  updateFormForQuestionType(type: string): void {
    this.options.clear();
    this.correctAnswers.clear();
    this.matches.clear();
    this.fillBlanks.clear();
    this.questionForm.get('correctAnswer')?.setValue(null);
    this.questionForm.get('correctAnswer')?.clearValidators();

    switch (type) {
      case 'Multiple Choice':
        this.addOption(); this.addOption(); this.addOption(); this.addOption();
        this.questionForm.get('correctAnswer')?.setValidators(Validators.required);
        break;
      case 'True/False':
        this.questionForm.get('correctAnswer')?.setValidators(Validators.required);
        break;
      case 'Multiple Response':
        this.addOption(); this.addOption(); this.addOption(); this.addOption();
        break;
      case 'Matching':
        this.addMatch(); this.addMatch(); this.addMatch();
        break;
      case 'Fill in the Blanks':
        this.addFillBlank();
        break;
      case 'Ranking/Ordering':
        this.addOption(); this.addOption(); this.addOption();
        break;
    }
    this.questionForm.get('correctAnswer')?.updateValueAndValidity();
  }

  // FormArray getters
  get options(): FormArray { return this.questionForm.get('options') as FormArray; }
  get correctAnswers(): FormArray { return this.questionForm.get('correctAnswers') as FormArray; }
  get matches(): FormArray { return this.questionForm.get('matches') as FormArray; }
  get fillBlanks(): FormArray { return this.questionForm.get('fillBlanks') as FormArray; }

  // Dynamic form field methods
  addOption(): void { this.options.push(this.fb.control('', Validators.required)); }
  removeOption(index: number): void { this.options.removeAt(index); }

  onCheckboxChange(event: any, index: number): void {
    const isChecked = event.target.checked;
    if (isChecked) {
      this.correctAnswers.push(this.fb.control(index));
    } else {
      const i = this.correctAnswers.controls.findIndex(x => x.value === index);
      this.correctAnswers.removeAt(i);
    }
  }

  addMatch(): void { this.matches.push(this.fb.group({ prompt: ['', Validators.required], answer: ['', Validators.required] })); }
  removeMatch(index: number): void { this.matches.removeAt(index); }

  addFillBlank(): void { this.fillBlanks.push(this.fb.group({ answer: ['', Validators.required] })); }
  removeFillBlank(index: number): void { this.fillBlanks.removeAt(index); }

  async onSubmit(): Promise<void> {
    if (this.questionForm.invalid) {
      this.errorMessage = 'Please fill all required fields.';
      return;
    }
    if (!this.schoolId || !this.teacherId) {
      this.errorMessage = 'Cannot submit, user or school ID is missing.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const questionData = {
      ...this.questionForm.value,
      schoolId: this.schoolId,
      teacherId: this.teacherId,
      status: 'for approval',
      createdAt: serverTimestamp()
    };

    try {
      const questionBankCollection = collection(this.firestore, `schools/${this.schoolId}/teachers/${this.teacherId}/question_bank`);
      await addDoc(questionBankCollection, questionData);
      this.successMessage = 'Question submitted for approval successfully!';
      
      // Optimistic update for the pending list
      const newQuestionForList = { ...this.questionForm.value, createdAt: { toDate: () => new Date() } };
      this.pendingQuestions.unshift(newQuestionForList);

      this.questionForm.reset({ questionType: 'Multiple Choice' });
      this.updateFormForQuestionType('Multiple Choice');
    } catch (error) {
      console.error('Error submitting question:', error);
      this.errorMessage = 'An error occurred while submitting the question.';
    } finally {
      this.isSubmitting = false;
    }
  }

  async loadApprovedQuestions(): Promise<void> {
    if (!this.schoolId || !this.teacherId) return;
    this.isLoadingQuestions = true;
    try {
      const q = query(
        collection(this.firestore, `schools/${this.schoolId}/teachers/${this.teacherId}/question_bank`),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      this.approvedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching approved questions:', error);
      // This might fail if the index is not created yet. We won't show an error to the user for this.
    } finally {
      this.isLoadingQuestions = false;
      this.cdr.detectChanges();
    }
  }

  async loadPendingQuestions(): Promise<void> {
    if (!this.schoolId || !this.teacherId) return;
    this.isLoadingPendingQuestions = true;
    try {
      const q = query(
        collection(this.firestore, `schools/${this.schoolId}/teachers/${this.teacherId}/question_bank`),
        where('status', '==', 'for approval'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      this.pendingQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching pending questions:', error);
    } finally {
      this.isLoadingPendingQuestions = false;
      this.cdr.detectChanges();
    }
  }
  
}
