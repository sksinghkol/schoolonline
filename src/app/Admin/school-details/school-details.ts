import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, docData, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';

interface SchoolSubscription {
  plan: string;
  seats: number;
  name?: string;
  price?: number;
  currency?: string;
  features?: string[];
  startsAt?: any;
  endsAt?: any;
}

interface School {
  id?: string;
  name: string;
  code: string;
  logoUrl?: string;
  subscription?: SchoolSubscription;
  status?: string;
  school_type?: string;
  establishment_year?: number;
  ownership_type?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  latitude?: number;
  phone_primary?: string;
  phone_secondary?: string;
  email?: string;
  website?: string;
  enrollment_capacity?: number;
  curriculum_type?: string;
  updated_at?: any;
}

@Component({
  selector: 'app-school-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './school-details.html',
  styleUrls: ['./school-details.scss'] // corrected property name
})
export class SchoolDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  schoolForm!: FormGroup;
  schoolId: string | null = null;
  school$!: Observable<School | null>;
  private schoolData: School | null = null;
  isEditing = false;

  states: string[] = ['Bihar', 'Uttar Pradesh', 'Maharashtra', 'West Bengal'];
  citiesByState: Record<string, string[]> = {
    Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur','Darbhanga', 'Purnia', 'Bettiah', 'Ara', 'Begusarai', 'Chhapra', 'Madhubani', 'Saharsa', 'Katihar', 'Sitamarhi', 'Samastipur', 'Nawada', 'Jamalpur', 'Siwan', 'Araria', 'Buxar', 'Jehanabad', 'Aurangabad', 'Gopalganj', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Munger', 'Nalanda', 'Rohtas', 'Saran', 'Sheikhpura', 'Vaishali', 'West Champaran', 'East Champaran', 'Kaimur', 'Khagaria', 'Supaul', 'Jamui', 'Banka', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran', 'Araria', 'Arwal', 'Begusarai', 'Bhagalpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
    'West Bengal': ['Kolkata', 'Darjeeling', 'Howrah', 'Siliguri']
  };
  cities: string[] = [];

  ngOnInit(): void {
    this.schoolForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      school_type: ['', Validators.required],
      establishment_year: [new Date().getFullYear(), Validators.required],
      ownership_type: ['', Validators.required],
      address_line1: [''],
      address_line2: [''],
      state: [''],
      city: [''],
      zip_code: [''],
      country: ['India'],
      latitude: [''],
      phone_primary: [''],
      phone_secondary: [''],
      email: ['', [Validators.email]],
      website: [''],
      enrollment_capacity: [''],
      curriculum_type: ['', Validators.required]
    });

    this.school$ = this.route.paramMap.pipe(
      switchMap(params => {
        this.schoolId = params.get('id');
        if (!this.schoolId) return of(null);
        const ref = doc(this.firestore, `schools/${this.schoolId}`);
        return docData(ref, { idField: 'id' }) as Observable<School>;
      })
    );

    this.school$.subscribe(data => {
      if (data) {
        this.schoolForm.patchValue(data);
        this.schoolData = data; // Store the original data
        this.onStateChangeInternal(data.state || '');
        this.schoolForm.disable(); // Disable form initially
      }
    });
  }

  onStateChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.onStateChangeInternal(select.value);
    this.schoolForm.patchValue({ city: '' });
  }

  private onStateChangeInternal(state: string) {
    this.cities = this.citiesByState[state] || [];
  }

  async updateSchool() {
    if (this.schoolForm.invalid || !this.schoolId) return;
    const ref = doc(this.firestore, `schools/${this.schoolId}`);
    const schoolData = this.schoolForm.getRawValue();
    try {
      await updateDoc(ref, { ...schoolData, updated_at: serverTimestamp() });
      alert('✅ School details updated successfully!');
      this.isEditing = false;
      this.schoolForm.disable();
    } catch (error) {
      console.error('Error updating school:', error);
      alert('❌ Failed to update school details.');
    }
  }

  goToAddDirector() {
    if (!this.schoolId) return;
    this.router.navigate(['/admin-dashboard/director', this.schoolId]);
  }

  back() {
    this.router.navigate(['/admin-dashboard/schools']);
  }

  toggleEdit() {
    this.isEditing = true;
    this.schoolForm.enable();
  }

  cancelEdit() {
    this.isEditing = false;
    this.schoolForm.disable();
    if (this.schoolData) {
      // Reset the form to its original state
      this.schoolForm.patchValue(this.schoolData);
      this.onStateChangeInternal(this.schoolData.state || '');
    }
  }
}
