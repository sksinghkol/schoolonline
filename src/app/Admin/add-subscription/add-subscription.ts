import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-subscription.html',
  styleUrls: ['./add-subscription.scss']
})
export class AddSubscription implements OnInit {
    subscriptions$: Observable<SubscriptionItem[]>;
    subscriptionForm: FormGroup;
    editingId: string | null = null;
  
    constructor(private firestore: Firestore, private fb: FormBuilder) {
      const subCol = collection(this.firestore, 'subscription');
      const q = query(subCol, orderBy('created_at', 'desc'));
      this.subscriptions$ = collectionData(q, { idField: 'id' }) as Observable<SubscriptionItem[]>;
  
      this.subscriptionForm = this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
        price: [0, [Validators.required, Validators.min(1)]],
        currency: ['INR', Validators.required],
        billing_cycle: ['monthly', Validators.required],
        features: this.fb.array([this.fb.control('')]),
        status: ['active', Validators.required]
      });
    }
  
    ngOnInit(): void {}

    trackById(_i: number, item: SubscriptionItem) { return item.id; }
  
    get featuresArray() {
      return this.subscriptionForm.get('features') as FormArray;
    }
  
    addFeatureField() {
      this.featuresArray.push(this.fb.control(''));
    }
  
    removeFeatureField(index: number) {
      this.featuresArray.removeAt(index);
    }
  
    private cleanedFeatures(): string[] {
      const values = (this.featuresArray.value || []) as unknown[];
      return values
        .map(v => (v == null ? '' : String(v)))
        .map(v => v.trim())
        .filter(v => v.length > 0);
    }
  
    private resetForm(): void {
      // Reset scalar controls
      this.subscriptionForm.patchValue({
        name: '',
        description: '',
        price: 0,
        currency: 'INR',
        billing_cycle: 'monthly',
        status: 'active'
      });
      // Rebuild features array with a single empty control
      while (this.featuresArray.length > 0) this.featuresArray.removeAt(0);
      this.featuresArray.push(this.fb.control(''));
    }

    edit(item: SubscriptionItem) {
      this.editingId = item.id ?? null;
      // Patch scalar values
      this.subscriptionForm.patchValue({
        name: item.name ?? '',
        description: item.description ?? '',
        price: Number(item.price ?? 0),
        currency: item.currency ?? 'INR',
        billing_cycle: item.billing_cycle ?? 'monthly',
        status: item.status ?? 'active'
      });
      // Rebuild features array from the item
      while (this.featuresArray.length > 0) this.featuresArray.removeAt(0);
      const feats = (item.features && item.features.length ? item.features : ['']);
      feats.forEach(f => this.featuresArray.push(this.fb.control(String(f ?? ''))));
    }

    async add() {
      if (this.subscriptionForm.invalid) return;
      const { name, description, price, currency, billing_cycle, status } = this.subscriptionForm.value;
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        console.error('Invalid price value:', price);
        return;
      }
      const features = this.cleanedFeatures();

      try {
        await addDoc(collection(this.firestore, 'subscription'), {
          name: String(name || ''),
          description: String(description || ''),
          price: priceNum,
          currency: String(currency || 'INR'),
          billing_cycle: String(billing_cycle || 'monthly'),
          features,
          status: (status === 'inactive' ? 'inactive' : 'active'),
          created_at: serverTimestamp()
        });
        this.resetForm();
      } catch (err) {
        console.error('Failed to add subscription:', err);
        throw err as any;
      }
    }

    async update() {
      if (!this.editingId || this.subscriptionForm.invalid) return;
      const { name, description, price, currency, billing_cycle, status } = this.subscriptionForm.value;
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        console.error('Invalid price value:', price);
        return;
      }
      const features = this.cleanedFeatures();

      const ref = doc(this.firestore, `subscription/${this.editingId}`);
      try {
        await updateDoc(ref, {
          name: String(name || ''),
          description: String(description || ''),
          price: priceNum,
          currency: String(currency || 'INR'),
          billing_cycle: String(billing_cycle || 'monthly'),
          features,
          status: (status === 'inactive' ? 'inactive' : 'active')
        });
        this.editingId = null;
        this.resetForm();
      } catch (err) {
        console.error('Failed to update subscription:', err);
        throw err;
      }
    }

    cancelEdit() {
      this.editingId = null;
      this.resetForm();
    }

    async remove(id: string) {
      if (!confirm('Delete this subscription?')) return;
      await deleteDoc(doc(this.firestore, `subscription/${id}`));
    }
  }