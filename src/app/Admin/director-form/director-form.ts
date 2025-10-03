import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, addDoc, collection, serverTimestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-director-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './director-form.html'
})
export class DirectorForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private fb = inject(FormBuilder);

  schoolId: string | null = null;
  form: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    photoUrl: ['']
  });
  saving = false;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.schoolId = params.get('schoolId');
    });
  }

  async saveDirector() {
    if (!this.schoolId) {
      alert('Missing schoolId. Please navigate from Add School.');
      return;
    }
    if (this.form.invalid) return;

    const { fullName, email, phone, photoUrl } = this.form.value;
    this.saving = true;
    try {
      await addDoc(collection(this.firestore, `schools/${this.schoolId}/director`), {
        fullName,
        email,
        phone,
        photoUrl: photoUrl || null,
        createdAt: serverTimestamp(),
        role: 'director'
      });
      alert('Director saved');
      this.form.reset();
      // Navigate back to schools list
      this.router.navigate(['admin-dashboard', 'schools']);
    } catch (e) {
      console.error('Failed to save director:', e);
      alert('Failed to save director.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.router.navigate(['admin-dashboard', 'schools']);
  }
}
