import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Firestore, collection, collectionData, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { SchoolStateService } from '../../core/services/school-state.service';

interface Student {
  id: string;
  class: string;
  section: string;
  roll: number;
  mobile: string;
  password: string;
}

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './student-login.html',
  styleUrls: ['./student-login.scss']
})
export class StudentLogin implements OnInit {
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  firestore = inject(Firestore);
  schoolState = inject(SchoolStateService);

  loginForm: FormGroup;

  classes = signal<string[]>([]);
  sections = signal<string[]>([]);
  rolls = signal<number[]>([]);
  studentsList: Student[] = [];

  selectedSchoolSlug: string | null = null;
  selectedSchool: any = null;

  
  
  constructor() {
    this.loginForm = this.fb.group({
      class: ['', Validators.required],
      section: ['', Validators.required],
      roll: ['', Validators.required],
      mobile: ['', Validators.required],
      password: ['', Validators.required]
    });
    effect(() => {
      const school = this.schoolState.currentSchool();
      if (school) {
        this.selectedSchool = school;
        this.loadStudents();
      }
    });
  }

  ngOnInit() {
    this.selectedSchoolSlug = this.route.snapshot.paramMap.get('schoolName');
    if (this.selectedSchoolSlug) {
      this.schoolState.setSchoolBySlug(this.selectedSchoolSlug);
    }
  }

  async loadStudents() {
    if (!this.selectedSchool) return;

    const studentsRef = collection(this.firestore, `schools/${this.selectedSchool.id}/students`);
    collectionData(studentsRef, { idField: 'id' }).subscribe((students: any[]) => {
      // ✅ Type cast and filter unknown values
      this.studentsList = students
        .map((s: any) => ({
          id: s.id,
          class: s.class as string,
          section: s.section as string,
          roll: Number(s.roll),
          mobile: s.mobile as string,
          password: s.password as string
        }))
        .filter(s => s.class && s.section && s.roll != null && s.mobile && s.password);

      const classList = this.studentsList.map(s => s.class);
      this.classes.set([...new Set(classList)]);
    });
  }

  onClassChange(event: any) {
    const selectedClass = event.target.value;
    const filteredSections = this.studentsList
      .filter(s => s.class === selectedClass)
      .map(s => s.section);
    this.sections.set([...new Set(filteredSections)]);
    this.rolls.set([]);
  }

  onSectionChange(event: any) {
    const selectedClass = this.loginForm.value.class;
    const selectedSection = event.target.value;
    const filteredRolls = this.studentsList
      .filter(s => s.class === selectedClass && s.section === selectedSection)
      .map(s => s.roll);
    this.rolls.set([...new Set(filteredRolls)]);
  }

  async login() {
    const { class: cls, section, roll, mobile, password } = this.loginForm.value;

    const student = this.studentsList.find(
      s => s.class === cls && s.section === section && s.roll === Number(roll) && s.mobile === mobile
    );

    if (!student) {
      alert('Student not found or mobile mismatch');
      return;
    }

    if (student.password !== password) {
      alert('Incorrect password');
      return;
    }

    // ✅ Save login history
    const historyRef = doc(collection(this.firestore, `loginHistory`));
    await setDoc(historyRef, {
      studentId: student.id,
      schoolCode: this.selectedSchool.code,
      loginAt: serverTimestamp(),
      device: this.getDeviceInfo()
    });

    // ✅ Redirect to student dashboard
    this.router.navigate(['/student-dashboard'], { queryParams: { studentId: student.id } });
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  }
}