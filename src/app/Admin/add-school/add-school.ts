import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { Router, RouterModule } from '@angular/router';

interface SchoolSubscription {
  plan: string;
  startsAt: any;
  seats: number;
  endsAt: any;
  name?: string;
  price?: number;
  currency?: string;
  features?: string[];
}

interface School {
  id?: string;
  name: string;
  code: string;
  logoUrl?: string;
  subscription?: SchoolSubscription;
  createdAt?: any;
  status?: string;
  address?: string;
  contact?: string;
}

interface SubscriptionItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: string;
  features: string[];
  status: 'active' | 'inactive';
  created_at?: any;
}


@Component({
  selector: 'app-add-school',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './add-school.html',
  styleUrls: ['./add-school.scss']
})
export class AddSchool implements OnInit, AfterViewInit {
  schools$: Observable<School[]>;
  subscriptions$: Observable<SubscriptionItem[]>;
  schoolForm: FormGroup;
  editingSchoolId: string | null = null;
  subscriptionList: SubscriptionItem[] = [];
  selectedFile: File | null = null;
  uploadingLogo = false;

  private firestore = inject(Firestore);
  private fb = inject(FormBuilder);
  private cloudinary = inject(CloudinaryService);
  private router = inject(Router);

  constructor() {
    const schoolsCol = collection(this.firestore, 'schools');
    this.schools$ = collectionData(schoolsCol, { idField: 'id' }) as Observable<School[]>;

    const subsCol = collection(this.firestore, 'subscription');
    this.subscriptions$ = collectionData(subsCol, { idField: 'id' }) as Observable<SubscriptionItem[]>;

    this.schoolForm = this.fb.group({
      name: ['', Validators.required],
      logoUrl: [''],
      plan: [''],
      seats: [500, [Validators.required, Validators.min(1)]],
      status: ['active', Validators.required],
      address: [''],
      contact: [''],
      subscriptionStarts: [''],
      subscriptionEnds: ['']
    });

    this.subscriptions$.subscribe(list => {
      this.subscriptionList = Array.isArray(list) ? list : [];
      const currentPlan = this.schoolForm?.get('plan')?.value;
      if (!this.subscriptionList.some(p => p.id === currentPlan) && this.subscriptionList.length > 0) {
        this.schoolForm.patchValue({ plan: this.subscriptionList[0].id });
      }
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const currentPlan = this.schoolForm?.get('plan')?.value;
    if (!this.subscriptionList.some(p => p.id === currentPlan) && this.subscriptionList.length > 0) {
      this.schoolForm.patchValue({ plan: this.subscriptionList[0].id });
    }
  }

  generateSchoolCode(): string {
    const prefix = '2';
    const random = Math.floor(100 + Math.random() * 900);
    return `${prefix}${random}`;
  }

  async addSchool() {
    if (this.schoolForm.invalid) return;

    const { name, logoUrl, plan, seats, status, address, contact, subscriptionStarts, subscriptionEnds } = this.schoolForm.value;
    const schoolCode = this.generateSchoolCode();
    const selectedPlan = this.subscriptionList.find(p => p.id === plan);

    const subscription: SchoolSubscription = {
      plan,
      seats,
      startsAt: subscriptionStarts ? new Date(subscriptionStarts) : serverTimestamp(),
      endsAt: subscriptionEnds ? new Date(subscriptionEnds) : null,
      name: selectedPlan?.name,
      price: selectedPlan?.price,
      currency: selectedPlan?.currency,
      features: selectedPlan?.features
    };

    try {
      let finalLogoUrl = logoUrl || '';
      if (this.selectedFile) {
        this.uploadingLogo = true;
        finalLogoUrl = await this.cloudinary.uploadImage(this.selectedFile);
        this.schoolForm.patchValue({ logoUrl: finalLogoUrl });
      }

      await addDoc(collection(this.firestore, 'schools'), {
        name,
        code: schoolCode,
        logoUrl: finalLogoUrl || null,
        subscription,
        status,
        address,
        contact,
        createdAt: serverTimestamp()
      });

      this.selectedFile = null;
      this.schoolForm.reset({ plan: this.subscriptionList[0]?.id || '', seats: 500, status: 'active' });
    } catch (e) {
      console.error('Failed to add school:', e);
      alert('Failed to add school. Please try again.');
    } finally {
      this.uploadingLogo = false;
    }
  }

  editSchool(school: School) {
    this.editingSchoolId = school.id!;
    this.schoolForm.setValue({
      name: school.name || '',
      logoUrl: school.logoUrl || '',
      plan: school.subscription?.plan || (this.subscriptionList[0]?.id || ''),
      seats: school.subscription?.seats || 500,
      status: school.status || 'active',
      address: school.address || '',
      contact: school.contact || '',
      subscriptionStarts: this.toDateInput(school.subscription?.startsAt),
      subscriptionEnds: this.toDateInput(school.subscription?.endsAt)
    });
  }

  async updateSchool() {
    if (!this.editingSchoolId || this.schoolForm.invalid) return;

    const { name, logoUrl, plan, seats, status, address, contact, subscriptionStarts, subscriptionEnds } = this.schoolForm.value;
    const schoolDoc = doc(this.firestore, `schools/${this.editingSchoolId}`);
    const selectedPlan = this.subscriptionList.find(p => p.id === plan);

    const subscription: SchoolSubscription = {
      plan,
      seats,
      startsAt: subscriptionStarts ? new Date(subscriptionStarts) : serverTimestamp(),
      endsAt: subscriptionEnds ? new Date(subscriptionEnds) : null,
      name: selectedPlan?.name,
      price: selectedPlan?.price,
      currency: selectedPlan?.currency,
      features: selectedPlan?.features
    };

    try {
      let finalLogoUrl = logoUrl || '';
      if (this.selectedFile) {
        this.uploadingLogo = true;
        finalLogoUrl = await this.cloudinary.uploadImage(this.selectedFile);
        this.schoolForm.patchValue({ logoUrl: finalLogoUrl });
      }

      await updateDoc(schoolDoc, {
        name,
        logoUrl: finalLogoUrl || null,
        subscription,
        status,
        address,
        contact
      });

      this.editingSchoolId = null;
      this.selectedFile = null;
      this.schoolForm.reset({ plan: this.subscriptionList[0]?.id || '', seats: 500, status: 'active' });
    } catch (e) {
      console.error('Failed to update school:', e);
      alert('Failed to update school. Please try again.');
    } finally {
      this.uploadingLogo = false;
    }
  }

  async removeSchool(schoolId: string) {
    if (!schoolId) return;
    if (!confirm('Are you sure you want to remove this school?')) return;

    try {
      await deleteDoc(doc(this.firestore, `schools/${schoolId}`));
      alert('School removed successfully.');
    } catch (e) {
      console.error('Failed to remove school:', e);
      alert('Failed to remove school. Please try again.');
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  private toDateInput(value: any): string {
    if (!value) return '';
    try {
      if (typeof value?.toDate === 'function') return value.toDate().toISOString().substring(0, 10);
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
    } catch {}
    return '';
  }

  cancelEdit() {
    this.editingSchoolId = null;
    this.selectedFile = null;
    this.schoolForm.reset({ plan: this.subscriptionList[0]?.id || '', seats: 500, status: 'active' });
  }
}