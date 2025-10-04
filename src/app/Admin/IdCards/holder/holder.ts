import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { CloudinaryService } from '../../../core/services/cloudinary.service';

interface PhotoItem {
  name: string;
  url: string;
}

interface HolderItem {
  id?: string;
  holder_name: string;
  description: string;
  price: number;
  photo: PhotoItem[];
}

@Component({
  selector: 'app-holder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './holder.html',
  styleUrls: ['./holder.scss']
})
export class Holder implements OnInit {
  holders$: Observable<HolderItem[]>;
  holderForm: FormGroup;
  editId: string | null = null;
  zoomImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private cloudinary: CloudinaryService
  ) {
    const holderCol = collection(this.firestore, 'holders');

    // Ensure photo array is always defined
    this.holders$ = collectionData(holderCol, { idField: 'id' }).pipe(
      map((holders: any[]) => holders.map(h => ({
        ...h,
        photo: h.photo || []
      })))
    ) as Observable<HolderItem[]>;

    this.holderForm = this.fb.group({
      holder_name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      photo: this.fb.array([this.createPhotoItem()])
    });
  }

  ngOnInit(): void {}

  // --- Form helpers ---
  get photoArray(): FormArray {
    return this.holderForm.get('photo') as FormArray;
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
    // If the last field is removed, add a new blank one
    if (this.photoArray.length === 0) {
      this.addPhotoField();
    }
  }

  async uploadPhoto(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

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
  async addHolder() {
    if (this.holderForm.invalid) return;

    const { holder_name, description, price, photo } = this.holderForm.value;

    try {
      if (this.editId) {
        const docRef = doc(this.firestore, 'holders', this.editId);
        await updateDoc(docRef, { holder_name, description, price, photo });
      } else {
        await addDoc(collection(this.firestore, 'holders'), { holder_name, description, price, photo });
      }
      this.resetForm();
    } catch (err) {
      console.error('Failed to add/update holder:', err);
    }
  }

  editHolder(holder: HolderItem) {
    this.editId = holder.id || null;
    this.holderForm.patchValue({
      holder_name: holder.holder_name,
      description: holder.description,
      price: holder.price
    });

    while (this.photoArray.length) this.photoArray.removeAt(0);
    if (holder.photo.length) {
      holder.photo.forEach(p => this.photoArray.push(this.fb.group(p)));
    } else {
      this.photoArray.push(this.createPhotoItem());
    }
  }

  async deleteHolder(id?: string) {
    if (!id || !confirm('Are you sure you want to delete this holder?')) return;
    await deleteDoc(doc(this.firestore, 'holders', id));
  }

  resetForm() {
    this.editId = null;
    this.holderForm.reset({ holder_name: '', description: '', price: 0 });
    while (this.photoArray.length) this.photoArray.removeAt(0);
    this.photoArray.push(this.createPhotoItem());
  }
}
