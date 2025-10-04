import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { CloudinaryService } from './../../../core/services/cloudinary.service';

interface PhotoItem {
  name: string;
  url: string;
}

interface ClipItem {
  id?: string;
  clip_name: string;
  description: string;
  price: number;
  photo: PhotoItem[];
}

@Component({
  selector: 'app-clip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clip.html',
  styleUrls: ['./clip.scss']
})
export class ClipComponent implements OnInit {
  clips$: Observable<ClipItem[]>;
  clipForm: FormGroup;
  editId: string | null = null;
  zoomImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private cloudinary: CloudinaryService
  ) {
    const clipCol = collection(this.firestore, 'clip'); // <-- matches Firestore rules
    this.clips$ = collectionData(clipCol, { idField: 'id' }).pipe(
      map((clips: any[]) => clips.map(c => ({ ...c, photo: c.photo || [] })))
    ) as Observable<ClipItem[]>;

    this.clipForm = this.fb.group({
      clip_name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      photo: this.fb.array([this.createPhotoItem()])
    });
  }

  ngOnInit(): void {}

  // --- Form helpers ---
  get photoArray(): FormArray {
    return this.clipForm.get('photo') as FormArray;
  }

  createPhotoItem(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      url: ['', Validators.required]
    });
  }

  addPhotoField() {
    this.photoArray.push(this.createPhotoItem());
  }

  removePhotoField(index: number) {
    this.photoArray.removeAt(index);
    if (this.photoArray.length === 0) this.addPhotoField();
  }

  async uploadPhoto(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    try {
      const url = await this.cloudinary.uploadImage(file);
      this.photoArray.at(index).patchValue({ url });
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
    }
  }

  // --- Modal ---
  openModal(url: string) {
    this.zoomImage = url;
  }

  // --- CRUD ---
  async addClip() {
    if (this.clipForm.invalid) return;

    const { clip_name, description, price, photo } = this.clipForm.value;

    try {
      const clipCol = collection(this.firestore, 'clip');
      if (this.editId) {
        const docRef = doc(this.firestore, 'clip', this.editId);
        await updateDoc(docRef, { clip_name, description, price, photo });
      } else {
        await addDoc(clipCol, { clip_name, description, price, photo });
      }
      this.resetForm();
    } catch (err) {
      console.error('Failed to add/update clip:', err);
    }
  }

  editClip(clip: ClipItem) {
    this.editId = clip.id || null;
    this.clipForm.patchValue({ clip_name: clip.clip_name, description: clip.description, price: clip.price });

    while (this.photoArray.length) this.photoArray.removeAt(0);
    if (clip.photo?.length) {
      clip.photo.forEach(p => this.photoArray.push(this.fb.group(p)));
    } else {
      this.photoArray.push(this.createPhotoItem());
    }
  }

  async deleteClip(id?: string) {
    if (!id || !confirm('Are you sure you want to delete this clip?')) return;
    try {
      await deleteDoc(doc(this.firestore, 'clip', id));
    } catch (err) {
      console.error('Failed to delete clip:', err);
    }
  }

  resetForm() {
    this.editId = null;
    this.clipForm.reset({ clip_name: '', description: '', price: 0 });
    while (this.photoArray.length) this.photoArray.removeAt(0);
    this.photoArray.push(this.createPhotoItem());
  }
}
