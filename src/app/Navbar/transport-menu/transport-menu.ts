import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SchoolStateService } from '../../core/services/school-state.service';
import { Firestore, doc, getDoc, DocumentData, updateDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-transport-menu',
  imports: [CommonModule, RouterLink],
  templateUrl: './transport-menu.html',
  styleUrl: './transport-menu.scss'
})
export class TransportMenu implements OnInit {
  private authService = inject(AuthService);
  public schoolState = inject(SchoolStateService); // public for template access
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private firebaseAuth = inject(Auth);

  // Signals for reactive state management
  private firebaseUser = signal<User | null>(null);
  public transport = signal<DocumentData | null>(null);
  public isLoading = signal(true);
  cartItemCount: number = 0;

  // Expose school details via computed getters so template reacts to signal changes
  schoolName = computed(() => this.schoolState.currentSchool()?.name || 'School');
  schoolLogoUrl = computed(() => this.schoolState.currentSchool()?.logoUrl || this.schoolState.currentSchool()?.logo);

  constructor() {
    // Listen to Firebase auth state changes and update the signal
    onAuthStateChanged(this.firebaseAuth, (user) => this.firebaseUser.set(user));

    // Effect to reactively fetch transport data when user or school changes
    effect(async () => {
      this.isLoading.set(true);
      const user = this.firebaseUser();
      const school = this.schoolState.currentSchool();

      if (user && school?.id) {
        try {
          const transportRef = doc(this.firestore, `schools/${school.id}/transports/${user.uid}`);
          const transportSnap = await getDoc(transportRef);

          if (transportSnap.exists()) {
            const transportData = transportSnap.data();
            // Sync photoURL from Google Auth to Firestore if it's different
            if (user.photoURL && transportData['photoURL'] !== user.photoURL) {
              await updateDoc(transportRef, { photoURL: user.photoURL });
              transportData['photoURL'] = user.photoURL; // Update local object immediately
            }
            this.transport.set(transportData);
          } else {
            this.transport.set(null);
          }
        } catch (error) {
          console.error("Error fetching transport data:", error);
          this.transport.set(null);
        }
      } else {
        this.transport.set(null);
      }
      this.isLoading.set(false);
    });
  }

  ngOnInit() {
    // Set current school from URL slug if present. The effect will handle the rest.
    const slug = this.route.snapshot.paramMap.get('schoolName');
    if (slug) {
      this.schoolState.setSchoolBySlug(slug);
    }
  }

  logoutToSchoolDashboard() {
    const school = this.schoolState.currentSchool();
    const slug = school?.slug || (school?.name ? String(school.name).replace(/\s+/g, '').toLowerCase() : '');
    const redirect = slug ? `/SchoolDashboard/${slug}` : '/';
    this.authService.logout(redirect);
  }
}
