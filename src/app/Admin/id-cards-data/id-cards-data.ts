import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { CloudinaryService } from './../../core/services/cloudinary.service';

interface PhotoItem {
  name: string;
  url: string;
}

interface SubItem {
  name: string;
  price: number;
  photo: PhotoItem[];
}

type SubCollectionName = 'holder' | 'lanyards' | 'cards' | 'clip';

interface IdCardItem {
  id?: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at?: any;
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './id-cards-data.html',
  styleUrls: ['./id-cards-data.scss']
})
export class IdCardsData implements OnInit {
  idCards$: Observable<IdCardItem[]>;
  idCardForm: FormGroup;
  public editingId: string | null = null;  // ✅ public

  readonly subCollections: SubCollectionName[] = ['holder', 'lanyards', 'cards', 'clip'];

  constructor(
    private firestore: Firestore,
    private fb: FormBuilder,
    private cloudinary: CloudinaryService
  ) {
    const idCol = collection(this.firestore, 'idcards');
    this.idCards$ = collectionData(idCol, { idField: 'id' }) as Observable<IdCardItem[]>;

    this.idCardForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: ['active', Validators.required],
      holder: this.fb.array([this.createSubItem()]),
      lanyards: this.fb.array([this.createSubItem()]),
      cards: this.fb.array([this.createSubItem()]),
      clip: this.fb.array([this.createSubItem()])
    });
  }

  ngOnInit(): void {}

  // --- Form helpers ---
  private createSubItem(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      photo: this.fb.array([this.createPhotoItem()])
    });
  }

  private createPhotoItem(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      url: ['', Validators.required]
    });
  }

  getSubArray(sub: SubCollectionName): FormArray {
    return this.idCardForm.get(sub) as FormArray;
  }

  getPhotoArray(sub: SubCollectionName, subIndex: number): FormArray {
    return this.getSubArray(sub).at(subIndex).get('photo') as FormArray;
  }

  addSubItemField(sub: SubCollectionName) {
    this.getSubArray(sub).push(this.createSubItem());
  }

  removeSubItemField(sub: SubCollectionName, index: number) {
    this.getSubArray(sub).removeAt(index);
  }

  addPhoto(sub: SubCollectionName, subIndex: number) {
    this.getPhotoArray(sub, subIndex).push(this.createPhotoItem());
  }

  removePhoto(sub: SubCollectionName, subIndex: number, photoIndex: number) {
    this.getPhotoArray(sub, subIndex).removeAt(photoIndex);
  }

  async uploadPhoto(event: Event, sub: SubCollectionName, subIndex: number, photoIndex: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    try {
      const url = await this.cloudinary.uploadImage(file);
      this.getPhotoArray(sub, subIndex).at(photoIndex).patchValue({ url });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  // --- Public resetForm to fix template error ---
  public resetForm() {
    this.idCardForm.patchValue({ name: '', description: '', status: 'active' });
    this.subCollections.forEach(sub => {
      const arr = this.getSubArray(sub);
      while (arr.length > 0) arr.removeAt(0);
      arr.push(this.createSubItem());
    });
    this.editingId = null;
  }

  // --- Subcollection CRUD ---
  async addSubItem(sub: SubCollectionName) {
    if (!this.editingId) {
      alert('Please save the ID card first.');
      return;
    }

    const arr = this.getSubArray(sub).value as SubItem[];
    try {
      await Promise.all(arr.map(item => {
        const plainItem = {
          name: String(item.name || ''),
          price: Number(item.price || 0),
          photo: (item.photo || []).map(p => ({
            name: String(p.name || ''),
            url: String(p.url || '')
          }))
        };
        return addDoc(collection(this.firestore, `idcards/${this.editingId}/${sub}`), plainItem);
      }));

      // Reset subcollection form array
      while (this.getSubArray(sub).length > 0) this.getSubArray(sub).removeAt(0);
      this.getSubArray(sub).push(this.createSubItem());
    } catch (err) {
      console.error(`Failed to add ${sub} items:`, err);
    }
  }

  async editSubItem(sub: SubCollectionName, itemIndex: number) {
    if (!this.editingId) return;

    const subArr = this.getSubArray(sub);
    const item = subArr.at(itemIndex).value as SubItem;

    const subColRef = collection(this.firestore, `idcards/${this.editingId}/${sub}`);
    const items = await firstValueFrom(collectionData(subColRef, { idField: 'id' }) as Observable<any[]>);

    const docId = items[itemIndex]?.id;
    if (!docId) return;

    const plainItem = {
      name: String(item.name || ''),
      price: Number(item.price || 0),
      photo: (item.photo || []).map(p => ({
        name: String(p.name || ''),
        url: String(p.url || '')
      }))
    };

    try {
      await updateDoc(doc(this.firestore, `idcards/${this.editingId}/${sub}/${docId}`), plainItem);
    } catch (err) {
      console.error(`Failed to update ${sub} item:`, err);
    }
  }

  async removeSubItem(sub: SubCollectionName, itemIndex: number) {
    if (!this.editingId) return;

    const subColRef = collection(this.firestore, `idcards/${this.editingId}/${sub}`);
    const items = await firstValueFrom(collectionData(subColRef, { idField: 'id' }) as Observable<any[]>);
    const docId = items[itemIndex]?.id;
    if (!docId) return;

    try {
      await deleteDoc(doc(this.firestore, `idcards/${this.editingId}/${sub}/${docId}`));
      this.getSubArray(sub).removeAt(itemIndex);
    } catch (err) {
      console.error(`Failed to delete ${sub} item:`, err);
    }
  }

  // --- Main ID card CRUD ---
  async add() {
    if (this.idCardForm.invalid) return;
    const { name, description, status } = this.idCardForm.value;

    try {
      const ref = await addDoc(collection(this.firestore, 'idcards'), {
        name: String(name || ''),
        description: String(description || ''),
        status,
        created_at: serverTimestamp()
      });
      this.editingId = ref.id; // ✅ ensures string | null
      alert('ID card created. Now you can add subcollection items.');
    } catch (err) {
      console.error('Failed to add ID card:', err);
    }
  }

  async update() {
    if (!this.editingId) return;
    const { name, description, status } = this.idCardForm.value;

    try {
      await updateDoc(doc(this.firestore, `idcards/${this.editingId}`), {
        name: String(name || ''),
        description: String(description || ''),
        status
      });
      alert('ID card updated');
    } catch (err) {
      console.error('Failed to update ID card:', err);
    }
  }

  async remove(id: string) {
    if (!confirm('Delete this ID card?')) return;
    try {
      await deleteDoc(doc(this.firestore, `idcards/${id}`));
    } catch (err) {
      console.error('Failed to delete ID card:', err);
    }
  }
}
