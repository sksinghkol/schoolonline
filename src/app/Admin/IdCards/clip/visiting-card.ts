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

interface VisitingCardItem {
  id?: string;
  card_name: string;
  description: string;
  price: number;
  photo: PhotoItem[];
}

@Component({
  selector: 'app-visiting-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './visiting-card.html',
  styleUrls: ['./visiting-card.scss']
})
export class VisitingCardComponent implements OnInit {
  visitingCards$: Observable<VisitingCardItem[]>;
  visitingCardForm: FormGroup;
  editId: string | null = null;
  zoomImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private cloudinary: CloudinaryService
  ) {
    const visitingCardCol = collection(this.firestore, 'visiting_cards');

    this.visitingCards$ = collectionData(visitingCardCol, { idField: 'id' }).pipe(
      map((cards: any[]) => cards.map(c => ({ ...c, photo: c.photo || [] })))
    ) as Observable<VisitingCardItem[]>;

    this.visitingCardForm = this.fb.group({
      card_name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      photo: this.fb.array([this.createPhotoItem()])
    });
  }

  ngOnInit(): void {}

  // --- Form Array ---
  get photoArray(): FormArray {
    return this.visitingCardForm.get('photo') as FormArray;
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
  async addVisitingCard() {
    if (this.visitingCardForm.invalid) return;

    const { card_name, description, price, photo } = this.visitingCardForm.value;

    try {
      if (this.editId) {
        const docRef = doc(this.firestore, 'visiting_cards', this.editId);
        await updateDoc(docRef, { card_name, description, price, photo });
      } else {
        await addDoc(collection(this.firestore, 'visiting_cards'), { card_name, description, price, photo });
      }
      this.resetForm();
    } catch (err) {
      console.error('Failed to add/update visiting card:', err);
    }
  }

  editVisitingCard(card: VisitingCardItem) {
    this.editId = card.id || null;
    this.visitingCardForm.patchValue({
      card_name: card.card_name,
      description: card.description,
      price: card.price
    });

    while (this.photoArray.length) this.photoArray.removeAt(0);

    if (card.photo && card.photo.length) {
      card.photo.forEach(p => this.photoArray.push(this.fb.group(p)));
    } else {
      this.photoArray.push(this.createPhotoItem());
    }
  }

  async deleteVisitingCard(id?: string) {
    if (!id || !confirm('Are you sure you want to delete this visiting card?')) return;
    try {
      await deleteDoc(doc(this.firestore, 'visiting_cards', id));
    } catch (err) {
      console.error('Failed to delete visiting card:', err);
    }
  }

  resetForm() {
    this.editId = null;
    this.visitingCardForm.reset({ card_name: '', description: '', price: 0 });
    while (this.photoArray.length) this.photoArray.removeAt(0);
    this.photoArray.push(this.createPhotoItem());
  }
}
