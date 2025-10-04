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

interface CardItem {
  id?: string;
  card_name: string;
  description: string;
  price: number;
  photo: PhotoItem[];
}

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cards.html',
  styleUrls: ['./cards.scss']
})
export class CardsComponent implements OnInit {
  cards$: Observable<CardItem[]>;
  cardForm: FormGroup;
  editId: string | null = null;
  zoomImage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private cloudinary: CloudinaryService
  ) {
    const cardCol = collection(this.firestore, 'cards');
    this.cards$ = collectionData(cardCol, { idField: 'id' }).pipe(
      map((cards: any[]) => cards.map(c => ({
        ...c,
        photo: c.photo || []
      })))
    ) as Observable<CardItem[]>;

    this.cardForm = this.fb.group({
      card_name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      photo: this.fb.array([this.createPhotoItem()])
    });
  }

  ngOnInit(): void {}

  // --- Form helpers ---
  get photoArray(): FormArray {
    return this.cardForm.get('photo') as FormArray;
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
  async addCard() {
    if (this.cardForm.invalid) return;

    const { card_name, description, price, photo } = this.cardForm.value;

    try {
      if (this.editId) {
        const docRef = doc(this.firestore, 'cards', this.editId);
        await updateDoc(docRef, { card_name, description, price, photo });
      } else {
        await addDoc(collection(this.firestore, 'cards'), { card_name, description, price, photo });
      }
      this.resetForm();
    } catch (err) {
      console.error('Failed to add/update card:', err);
    }
  }

  editCard(card: CardItem) {
    this.editId = card.id || null;
    this.cardForm.patchValue({
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

  async deleteCard(id?: string) {
    if (!id || !confirm('Are you sure you want to delete this card?')) return;
    await deleteDoc(doc(this.firestore, 'cards', id));
  }

  resetForm() {
    this.editId = null;
    this.cardForm.reset({ card_name: '', description: '', price: 0 });
    while (this.photoArray.length) this.photoArray.removeAt(0);
    this.photoArray.push(this.createPhotoItem());
  }
}
