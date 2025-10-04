import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDocs } from '@angular/fire/firestore';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-add-director',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './add-director.html',
  styleUrls: ['./add-director.scss']
})
export class AddDirector implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private cloudinaryService = inject(CloudinaryService);

  schoolId!: string;
  directorForm!: FormGroup;

  ngOnInit() {
    this.schoolId = this.route.snapshot.paramMap.get('schoolId') || '';
    this.directorForm = this.fb.group({
      directors: this.fb.array([])
    });

    this.loadDirectors();
  }

  get directors(): FormArray {
    return this.directorForm.get('directors') as FormArray;
  }

  createDirectorGroup(existingData: any = null): FormGroup {
    return this.fb.group({
      id: [existingData?.id || ''],
      name: [existingData?.name || '', Validators.required],
      designation: [existingData?.designation || '', Validators.required],
      phone: [existingData?.phone || '', Validators.required],
      email: [existingData?.email || '', [Validators.email]],
      imageUrl: [existingData?.imageUrl || ''],
      message: [existingData?.message || '']
    });
  }

  addDirector(existingData: any = null) {
    this.directors.push(this.createDirectorGroup(existingData));
  }

  removeDirector(index: number) {
    const director = this.directors.at(index).value;
    if (director.id) {
      const docRef = doc(this.firestore, `schools/${this.schoolId}/directors/${director.id}`);
      deleteDoc(docRef).catch(err => console.error('Failed to delete director:', err));
    }
    if (this.directors.length > 1) this.directors.removeAt(index);
  }

  async uploadImage(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    try {
      const url = await this.cloudinaryService.uploadImage(file);
      this.directors.at(index).patchValue({ imageUrl: url });
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Image upload failed');
    }
  }

  private async loadDirectors() {
    if (!this.schoolId) return;
    try {
      const directorsCollection = collection(this.firestore, `schools/${this.schoolId}/directors`);
      const snapshot = await getDocs(directorsCollection);
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        this.addDirector({ ...data, id: docSnap.id });
      });
      if (this.directors.length === 0) this.addDirector();
    } catch (err) {
      console.error('Failed to load directors:', err);
    }
  }

async saveDirectors() {
  if (!this.schoolId) return alert('Missing school info');
  if (this.directorForm.invalid) return alert('Fill all required fields');

  const directorsCollection = collection(this.firestore, `schools/${this.schoolId}/directors`);

  for (let i = 0; i < this.directors.length; i++) {
    const d = this.directors.at(i).value;
    const data: any = {
      name: d.name,
      designation: d.designation,
      phone: d.phone,
      email: d.email,
      imageUrl: d.imageUrl,
      message: d.message,
      schoolId: this.schoolId,
      updated_at: serverTimestamp()
    };

    try {
      if (d.id) {
        // Update existing director (do NOT include created_at)
        const docRef = doc(this.firestore, `schools/${this.schoolId}/directors/${d.id}`);
        await updateDoc(docRef, data);
      } else {
        // Create new director (include created_at)
        data.created_at = serverTimestamp();
        await addDoc(directorsCollection, data);
      }
    } catch (err) {
      console.error('Failed to save director:', err);
      alert('Failed to save director');
    }
  }

  alert('✅ Directors saved!');
  this.router.navigate(['/admin-dashboard/idcards', this.schoolId]);
}

  skip() {
    this.router.navigate(['/admin-dashboard/idcards', this.schoolId]);
  }
}
