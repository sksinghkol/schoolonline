import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from '@angular/fire/firestore';
import { SchoolStateService } from '../../core/services/school-state.service';

@Component({
  selector: 'app-master',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './master.html',
  styleUrl: './master.scss'
})
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
    try {
      const querySnapshot = await getDocs(q);
      this.classes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error loading classes:", error);
      this.errorMessage = "Failed to load classes.";
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit() {
    if (this.classForm.invalid || !this.schoolId) {
      return;
    }

    const classData = {
      ...this.classForm.value,
      updatedAt: serverTimestamp()
    };

    try {
      if (this.isEditing && this.currentClassId) {
        const classDocRef = doc(this.firestore, `schools/${this.schoolId}/classes/${this.currentClassId}`);
        await updateDoc(classDocRef, { ...this.classForm.value, updatedAt: serverTimestamp() });
        this.successMessage = "Class updated successfully.";
        // Optimistically update the local array
        const index = this.classes.findIndex(c => c.id === this.currentClassId);
        if (index > -1) {
          this.classes[index] = { ...this.classes[index], ...this.classForm.value };
          this.sortClasses();
        }
      } else {
        const classesCollection = collection(this.firestore, `schools/${this.schoolId}/classes`);
        const docRef = await addDoc(classesCollection, { ...this.classForm.value, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        this.successMessage = "Class added successfully.";
        // Optimistically add to the local array
        const newClass = {
          id: docRef.id,
          ...this.classForm.value,
          // Timestamps will be null until next full load, but that's okay for display
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.classes.push(newClass);
        this.sortClasses();
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
      // Optimistically remove from the local array
      this.classes = this.classes.filter(c => c.id !== classId);
    } catch (error) {
      console.error("Error deleting class:", error);
      this.errorMessage = "Failed to delete class.";
    }
  }

  private sortClasses() {
    this.classes.sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section));
  }

  resetForm() {
    this.isEditing = false;
    this.currentClassId = null;
    this.classForm.reset();
    this.successMessage = null;
    this.errorMessage = null;
  }
}
