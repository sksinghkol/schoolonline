import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { CloudinaryService } from './../../core/services/cloudinary.service';

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
  selector: 'app-visiting-cards',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './visiting-cards.html',
  styleUrls: ['./visiting-cards.scss']
})
export class VisitingCardsComponent implements OnInit {
  visitingCards$: Observable<VisitingCardItem[]>;
  visitingCardForm: FormGroup;
  editingId: string | null = null;

  constructor(private fb: FormBuilder, private firestore: Firestore, private cloudinary: CloudinaryService) {
    const vcCol = collection(this.firestore, 'visiting_cards');
    this.visitingCards$ = collectionData(vcCol, { idField: 'id' }) as Observable<VisitingCardItem[]>;

    this.visitingCardForm = this.fb.group({
      card_name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      photo: this.fb.array([this.createPhotoItem()])
    });
  }

  ngOnInit(): void {}

  // --- Form helpers ---
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

  // --- CRUD ---
  async addOrUpdateVisitingCard() {
    if (this.visitingCardForm.invalid) return;
    const { card_name, description, price, photo } = this.visitingCardForm.value;

    try {
      if (this.editingId) {
        // Update existing
        const ref = doc(this.firestore, 'visiting_cards', this.editingId);
        await updateDoc(ref, {
          card_name: String(card_name || ''),
          description: String(description || ''),
          price: Number(price || 0),
          photo: (photo || []).map((p: any) => ({ name: String(p.name || ''), url: String(p.url || '') }))
        });
      } else {
        // Add new
        await addDoc(collection(this.firestore, 'visiting_cards'), {
          card_name: String(card_name || ''),
          description: String(description || ''),
          price: Number(price || 0),
          photo: (photo || []).map((p: any) => ({ name: String(p.name || ''), url: String(p.url || '') }))
        });
      }

      this.resetForm();
    } catch (err) {
      console.error('Save failed:', err);
    }
  }

  async deleteVisitingCard(id: string) {
    try {
      await deleteDoc(doc(this.firestore, 'visiting_cards', id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  editVisitingCard(card: VisitingCardItem) {
    this.editingId = card.id || null;
    this.visitingCardForm.patchValue({
      card_name: card.card_name,
      description: card.description,
      price: card.price
    });

    // Reset photo array
    while (this.photoArray.length > 0) this.photoArray.removeAt(0);
    card.photo.forEach(ph => {
      this.photoArray.push(this.fb.group({
        name: [ph.name, Validators.required],
        url: [ph.url, Validators.required]
      }));
    });
  }

  resetForm() {
    this.visitingCardForm.reset({ card_name: '', description: '', price: 0 });
    while (this.photoArray.length > 0) this.photoArray.removeAt(0);
    this.photoArray.push(this.createPhotoItem());
    this.editingId = null;
  }
}
