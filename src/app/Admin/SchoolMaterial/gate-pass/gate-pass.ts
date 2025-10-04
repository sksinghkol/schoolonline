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

interface GatePassItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  photo: PhotoItem[];
}

@Component({
  selector: 'app-gate-pass',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gate-pass.html',
  styleUrls: ['./gate-pass.scss']
})
export class GatePass implements OnInit {
  gatePassItems$: Observable<GatePassItem[]>;
  gatePassForm: FormGroup;
  editId: string | null = null;
  zoomImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private cloudinary: CloudinaryService
  ) {
    const gatePassCol = collection(this.firestore, 'gate_pass');

    this.gatePassItems$ = collectionData(gatePassCol, { idField: 'id' }).pipe(
      map((items: any[]) => items.map(i => ({ ...i, photo: i.photo || [] })))
    ) as Observable<GatePassItem[]>;

    this.gatePassForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      photo: this.fb.array([this.createPhotoItem()])
    });
  }

  ngOnInit(): void {}

  // --- Form Array ---
  get photoArray(): FormArray {
    return this.gatePassForm.get('photo') as FormArray;
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
    if (!input.files || input.files.length === 0) return;

    try {
      const url = await this.cloudinary.uploadImage(input.files[0]);
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
  async addGatePass() {
    if (this.gatePassForm.invalid) return;

    const formValue = this.gatePassForm.value;

    try {
      if (this.editId) {
        const docRef = doc(this.firestore, 'gate_pass', this.editId);
        await updateDoc(docRef, formValue);
      } else {
        await addDoc(collection(this.firestore, 'gate_pass'), formValue);
      }
      this.resetForm();
    } catch (err) {
      console.error('Failed to add/update gate pass:', err);
    }
  }

  editGatePass(item: GatePassItem) {
    this.editId = item.id || null;
    this.gatePassForm.patchValue({
      name: item.name,
      description: item.description,
      price: item.price
    });

    while (this.photoArray.length) this.photoArray.removeAt(0);

    if (item.photo && item.photo.length) {
      item.photo.forEach(p => this.photoArray.push(this.fb.group(p)));
    } else {
      this.photoArray.push(this.createPhotoItem());
    }
  }

  async deleteGatePass(id?: string) {
    if (!id || !confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(this.firestore, 'gate_pass', id));
    } catch (err) {
      console.error('Failed to delete gate pass:', err);
    }
  }

  resetForm() {
    this.editId = null;
    this.gatePassForm.reset({ name: '', description: '', price: 0 });
    while (this.photoArray.length) this.photoArray.removeAt(0);
    this.photoArray.push(this.createPhotoItem());
  }
}