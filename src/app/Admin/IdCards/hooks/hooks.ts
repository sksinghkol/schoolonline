import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { CloudinaryService } from './../../../core/services/cloudinary.service';

interface PhotoItem {
  name: string;
  url: string;
}

interface HookItem {
  id?: string;
  hook_name: string;
  description: string;
  price: number;
  photo: PhotoItem[];
}

@Component({
  selector: 'app-hooks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hooks.html',
  styleUrls: ['./hooks.scss']
})
export class Hooks implements OnInit {
  hooks$: Observable<HookItem[]>;
  hookForm: FormGroup;
  editId: string | null = null;
  zoomImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private cloudinary: CloudinaryService
  ) {
    const hookCol = collection(this.firestore, 'hooks');
    this.hooks$ = collectionData(hookCol, { idField: 'id' }).pipe(
      map((hooks: any[]) => hooks.map(h => ({
        ...h,
        photo: h.photo || []
      })))
    ) as Observable<HookItem[]>;

    this.hookForm = this.fb.group({
      hook_name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      photo: this.fb.array([this.createPhotoItem()])
    });
  }

  ngOnInit(): void {}

  // --- Form helpers ---
  get photoArray(): FormArray {
    return this.hookForm.get('photo') as FormArray;
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
  async addHook() {
    if (this.hookForm.invalid) return;

    const { hook_name, description, price, photo } = this.hookForm.value;
    try {
      if (this.editId) {
        const docRef = doc(this.firestore, 'hooks', this.editId);
        await updateDoc(docRef, { hook_name, description, price, photo });
      } else {
        await addDoc(collection(this.firestore, 'hooks'), { hook_name, description, price, photo });
      }
      this.resetForm();
    } catch (err) {
      console.error('Failed to add/update hook:', err);
    }
  }

  editHook(hook: HookItem) {
    this.editId = hook.id || null;
    this.hookForm.patchValue({
      hook_name: hook.hook_name,
      description: hook.description,
      price: hook.price
    });

    while (this.photoArray.length) this.photoArray.removeAt(0);
    if (hook.photo && hook.photo.length) {
      hook.photo.forEach(p => this.photoArray.push(this.fb.group(p)));
    } else {
      this.photoArray.push(this.createPhotoItem());
    }
  }

  async deleteHook(id?: string) {
    if (!id || !confirm('Are you sure you want to delete this hook?')) return;
    try {
      await deleteDoc(doc(this.firestore, 'hooks', id));
    } catch (err) {
      console.error('Failed to delete hook:', err);
    }
  }

  resetForm() {
    this.editId = null;
    this.hookForm.reset({ hook_name: '', description: '', price: 0 });
    while (this.photoArray.length) this.photoArray.removeAt(0);
    this.photoArray.push(this.createPhotoItem());
  }
}