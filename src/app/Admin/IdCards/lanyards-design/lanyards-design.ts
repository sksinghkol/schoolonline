import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { CloudinaryService } from '../../../core/services/cloudinary.service';

interface Photo {
  url: string;
  caption: string;
}

interface LanyardDesign {
  id?: string;
  lanyardName: string;
  lanyardCode: string;
  lanyard_type: string;
  photos: Photo[];
}

@Component({
  selector: 'app-lanyards-design',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lanyards-design.html',
  styleUrls: ['./lanyards-design.scss']
})
export class LanyardsDesign implements OnInit {
  lanyardDesigns$: Observable<LanyardDesign[]>;
  lanyardDesignForm: FormGroup;
  editId: string | null = null;
  zoomedPhotoUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private cloudinary: CloudinaryService
  ) {
    const lanyardDesignCol = collection(this.firestore, 'lanyard_design');
    this.lanyardDesigns$ = collectionData(lanyardDesignCol, { idField: 'id' }) as Observable<LanyardDesign[]>;

    this.lanyardDesignForm = this.fb.group({
      lanyardName: ['', Validators.required],
      lanyardCode: [''],
      lanyard_type: ['', Validators.required],
      photos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.addPhotoField(); // Start with one photo field
  }

  // --- Form Array for Photos ---
  get photosArray(): FormArray {
    return this.lanyardDesignForm.get('photos') as FormArray;
  }

  createPhotoGroup(): FormGroup {
    return this.fb.group({
      url: ['', Validators.required],
      caption: ['']
    });
  }

  addPhotoField(): void {
    this.photosArray.push(this.createPhotoGroup());
  }

  removePhotoField(index: number): void {
    this.photosArray.removeAt(index);
  }

  // --- Image Upload ---
  async onFileSelected(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    try {
      const file = input.files[0];
      const url = await this.cloudinary.uploadImage(file);
      this.photosArray.at(index).patchValue({ url });
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
    }
  }

  // --- CRUD Operations ---
  async saveLanyardDesign(): Promise<void> {
    if (this.lanyardDesignForm.invalid) return;

    const formValue = this.lanyardDesignForm.value;

    try {
      if (this.editId) {
        // Update existing document
        const docRef = doc(this.firestore, 'lanyard_design', this.editId);
        await updateDoc(docRef, formValue);
      } else {
        // Create new document
        formValue.lanyardCode = this.generateLanyardCode(); // Generate code for new lanyards
        await addDoc(collection(this.firestore, 'lanyard_design'), formValue);
      }
      this.resetForm();
    } catch (err) {
      console.error('Failed to save lanyard design:', err);
    }
  }

  editLanyardDesign(lanyard: LanyardDesign): void {
    this.editId = lanyard.id || null;
    this.lanyardDesignForm.patchValue(lanyard);

    this.photosArray.clear();
    lanyard.photos.forEach(photo => this.photosArray.push(this.fb.group(photo)));
  }

  // --- Photo Modal ---
  openPhotoModal(photos: Photo[], index: number): void {
    if (photos && photos.length > index) {
      this.zoomedPhotoUrl = photos[index].url;
    }
  }

  closePhotoModal(): void {
    this.zoomedPhotoUrl = null;
  }

  async deleteLanyardDesign(id?: string): Promise<void> {
    if (!id) return;

    if (confirm('Are you sure you want to delete this lanyard design?')) {
      try {
        await deleteDoc(doc(this.firestore, 'lanyard_design', id));
      } catch (err) {
        console.error('Failed to delete lanyard design:', err);
      }
    }
  }

  resetForm(): void {
    this.editId = null;
    this.lanyardDesignForm.reset({ lanyardName: '', lanyardCode: '', lanyard_type: '' });
    this.photosArray.clear();
    this.addPhotoField();
  }

  getCarouselId(lanyardId?: string): string {
    return `carousel-${lanyardId || 'new'}`;
  }

  private generateLanyardCode(): string {
    const randomNumber = Math.floor(10000 + Math.random() * 90000); // Generate a 5-digit number
    return `LYD${randomNumber}`;
  }

}