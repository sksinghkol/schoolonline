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

interface LanyardItem {
  id?: string;
  lanyard_name: string;
  description: string;
  price: number;
  photo: PhotoItem[];
}

@Component({
  selector: 'app-lanyards',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lanyards.html',
  styleUrls: ['./lanyards.scss']
})
export class LanyardsComponent implements OnInit {
  lanyards$: Observable<LanyardItem[]>;
  lanyardForm: FormGroup;
  editId: string | null = null;
  zoomImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private cloudinary: CloudinaryService
  ) {
    const lanyardCol = collection(this.firestore, 'lanyards');
    this.lanyards$ = collectionData(lanyardCol, { idField: 'id' }).pipe(
      map((lanyards: any[]) => lanyards.map(l => ({
        ...l,
        photo: l.photo || []
      })))
    ) as Observable<LanyardItem[]>;

    this.lanyardForm = this.fb.group({
      lanyard_name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      photo: this.fb.array([this.createPhotoItem()])
    });
  }

  ngOnInit(): void {}

  // --- Form helpers ---
  get photoArray(): FormArray {
    return this.lanyardForm.get('photo') as FormArray;
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
  async addLanyard() {
    if (this.lanyardForm.invalid) return;

    const { lanyard_name, description, price, photo } = this.lanyardForm.value;
    try {
      if (this.editId) {
        const docRef = doc(this.firestore, 'lanyards', this.editId);
        await updateDoc(docRef, { lanyard_name, description, price, photo });
      } else {
        await addDoc(collection(this.firestore, 'lanyards'), { lanyard_name, description, price, photo });
      }
      this.resetForm();
    } catch (err) {
      console.error('Failed to add/update lanyard:', err);
    }
  }

  editLanyard(lanyard: LanyardItem) {
    this.editId = lanyard.id || null;
    this.lanyardForm.patchValue({
      lanyard_name: lanyard.lanyard_name,
      description: lanyard.description,
      price: lanyard.price
    });

    while (this.photoArray.length) this.photoArray.removeAt(0);
    if (lanyard.photo && lanyard.photo.length) {
      lanyard.photo.forEach(p => this.photoArray.push(this.fb.group(p)));
    } else {
      this.photoArray.push(this.createPhotoItem());
    }
  }

  async deleteLanyard(id?: string) {
    if (!id || !confirm('Are you sure you want to delete this lanyard?')) return;
    try {
      await deleteDoc(doc(this.firestore, 'lanyards', id));
    } catch (err) {
      console.error('Failed to delete lanyard:', err);
    }
  }

  resetForm() {
    this.editId = null;
    this.lanyardForm.reset({ lanyard_name: '', description: '', price: 0 });
    while (this.photoArray.length) this.photoArray.removeAt(0);
    this.photoArray.push(this.createPhotoItem());
  }
}
