import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';

type SubCollectionName = 'holders' | 'lanyards' | 'cards';

interface IdCardItem {
  id?: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at?: any;
}

interface SubItem {
  id?: string;
  colorderimage: string;
}

@Component({
  selector: 'app-id-cards',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './id-cards.html',
  styleUrl: './id-cards.scss'
})
export class IdCards implements OnInit {
  idCards$: Observable<IdCardItem[]>;
  idCardForm: FormGroup;
  editingId: string | null = null;

  readonly subCollections: SubCollectionName[] = ['holders', 'lanyards', 'cards'];

  constructor(private firestore: Firestore, private fb: FormBuilder) {
    const idCol = collection(this.firestore, 'idcards');
    const q = query(idCol, orderBy('created_at', 'desc'));
    this.idCards$ = collectionData(q, { idField: 'id' }) as Observable<IdCardItem[]>;

    // Initialize form
    this.idCardForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: ['active', Validators.required],
      holders: this.fb.array([this.createSubItem()]),
      lanyards: this.fb.array([this.createSubItem()]),
      cards: this.fb.array([this.createSubItem()])
    });
  }

  ngOnInit(): void {}

  // Helper to create subcollection FormGroup
  private createSubItem(): FormGroup {
    return this.fb.group({ colorderimage: ['', Validators.required] });
  }

  getSubArray(name: SubCollectionName): FormArray {
    return this.idCardForm.get(name) as FormArray;
  }

  addSubItem(name: SubCollectionName) {
    this.getSubArray(name).push(this.createSubItem());
  }

  removeSubItem(name: SubCollectionName, index: number) {
    this.getSubArray(name).removeAt(index);
  }

  private resetForm(): void {
    this.idCardForm.patchValue({
      name: '',
      description: '',
      status: 'active'
    });

    this.subCollections.forEach(sub => {
      const arr = this.getSubArray(sub);
      while (arr.length > 0) arr.removeAt(0);
      arr.push(this.createSubItem());
    });

    this.editingId = null;
  }

  async add() {
    if (this.idCardForm.invalid) return;

    const { name, description, status } = this.idCardForm.value;

    try {
      const ref = await addDoc(collection(this.firestore, 'idcards'), {
        name,
        description,
        status,
        created_at: serverTimestamp()
      });

      // Add subcollections
      await Promise.all(this.subCollections.map(sub => {
        const arr = this.getSubArray(sub).value as SubItem[];
        return Promise.all(arr.map(item => addDoc(collection(this.firestore, `idcards/${ref.id}/${sub}`), item)));
      }));

      this.resetForm();
    } catch (err) {
      console.error('Failed to add ID card:', err);
    }
  }

  async edit(item: IdCardItem) {
    this.editingId = item.id ?? null;

    this.idCardForm.patchValue({
      name: item.name ?? '',
      description: item.description ?? '',
      status: item.status ?? 'active'
    });

    // Load subcollections
    for (const sub of this.subCollections) {
      const arr = this.getSubArray(sub);
      while (arr.length > 0) arr.removeAt(0);

      const subColRef = collection(this.firestore, `idcards/${item.id}/${sub}`);
      const data = await firstValueFrom(collectionData(subColRef, { idField: 'id' }) as Observable<SubItem[]>);
      if (data && data.length) {
        data.forEach(d => arr.push(this.fb.group({ colorderimage: [d.colorderimage, Validators.required] })));
      } else {
        arr.push(this.createSubItem());
      }
    }
  }

  async update() {
    if (!this.editingId || this.idCardForm.invalid) return;

    const { name, description, status } = this.idCardForm.value;

    const ref = doc(this.firestore, `idcards/${this.editingId}`);
    try {
      await updateDoc(ref, { name, description, status });

      // Clear and re-add subcollections
      for (const sub of this.subCollections) {
        const arr = this.getSubArray(sub).value as SubItem[];
        const subColRef = collection(this.firestore, `idcards/${this.editingId}/${sub}`);
        const snapshot = await firstValueFrom(collectionData(subColRef, { idField: 'id' }) as Observable<SubItem[]>);
        snapshot?.forEach(async s => await deleteDoc(doc(this.firestore, `idcards/${this.editingId}/${sub}/${s.id}`)));
        await Promise.all(arr.map(item => addDoc(collection(this.firestore, `idcards/${this.editingId}/${sub}`), item)));
      }

      this.resetForm();
    } catch (err) {
      console.error('Failed to update ID card:', err);
    }
  }

  cancelEdit() {
    this.resetForm();
  }

  async remove(id: string) {
    if (!confirm('Delete this ID card data?')) return;
    await deleteDoc(doc(this.firestore, `idcards/${id}`));
  }

  trackById(_i: number, item: any) { return item.id; }
}