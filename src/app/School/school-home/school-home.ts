import { Component, OnInit, inject, ChangeDetectorRef, Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, query, where, getDocs, limit, onSnapshot, orderBy, addDoc, runTransaction, doc, DocumentData } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { SchoolStateService } from '../../core/services/school-state.service';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { QRCodeComponent } from 'angularx-qrcode';
import { Observable, of } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-school-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, QRCodeComponent],
  templateUrl: './school-home.html',
  styleUrls: ['./school-home.scss']
})
export class SchoolHome implements OnInit {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private schoolState = inject(SchoolStateService);
  private injector = inject(Injector);
  private fb = inject(FormBuilder);
  private auth = inject(Auth);

  schoolData: any = null;
  loading = true;
  matchedVariant: string | null = null;
  incomingName: string | null = null;

  // Properties for the review system
  reviewForm!: FormGroup;
  replyForm!: FormGroup;
  currentUser: User | null = null;
  submittingReview = false;
  submittingReply = false;
  replyingTo: string | null = null;
  hoveredRating = 0;
  reviews$: Observable<DocumentData[]> = of([]);
  currentUrl: string = '';
  whatsAppShareUrl: string = '';
  generatingPdf = false;


  async ngOnInit() {
    const rawName = this.route.snapshot.paramMap.get('schoolName')
      || this.route.parent?.snapshot.paramMap.get('schoolName')
      || this.route.root?.snapshot.paramMap.get('schoolName')
      || '';

    const schoolSlug = rawName.trim().toLowerCase().replace(/\s+/g, '');
    this.incomingName = rawName;

    if (!schoolSlug) {
      this.schoolState.currentSchool.set(null);
      this.loading = false;
      return;
    }

    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.replyForm = this.fb.group({
      replyComment: ['', [Validators.required, Validators.minLength(2)]]
    });

    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    try {
      await this.loadSchoolBySlug(schoolSlug);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadSchoolBySlug(slug: string) {
    return runInInjectionContext(this.injector, async () => {
      const schoolsCol = collection(this.firestore, 'schools');
      
      // First try exact slug match
      let q = query(schoolsCol, where('slug', '==', slug), limit(1));
      let snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        this.schoolData = this.formatSchoolData(doc);
        this.schoolState.currentSchool.set(this.schoolData);
        this.matchedVariant = slug;
        this.setupShareableLinks();
        this.loadReviews(this.schoolData.id);
        console.log('SchoolHome: Found school:', this.schoolData);
        return;
      }

      // If no slug match, try exact code match using the original incoming value (not lowercased)
      const original = this.incomingName?.trim() || '';
      if (original) {
        q = query(schoolsCol, where('code', '==', original), limit(1));
        snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          this.schoolData = this.formatSchoolData(doc);
          this.schoolState.currentSchool.set(this.schoolData);
          this.matchedVariant = (this.schoolData as any).slug || original;
          this.setupShareableLinks();
          this.loadReviews(this.schoolData.id);
          console.log('SchoolHome: Found school by code:', this.schoolData);
          return;
        }
      }

      // If no exact match, try case-insensitive / closest variant match
      const allSnapshot = await getDocs(schoolsCol);
      let closest: any = null;
      let closestDiff = Infinity;
      allSnapshot.forEach(doc => {
        const data = doc.data();
        if (data['slug']) {
          const diff = this.stringDiff(slug, data['slug'].toLowerCase());
          if (diff < closestDiff) {
            closestDiff = diff;
            closest = { id: doc.id, ...data };
          }
        }
      });

      if (closest) {
        this.schoolData = closest;
        this.matchedVariant = closest.slug;
        this.schoolState.currentSchool.set(this.schoolData);
        this.setupShareableLinks();
        this.loadReviews(this.schoolData.id);
        console.warn(`SchoolHome: No exact match. Showing closest variant: ${closest.slug}`);
      } else {
        console.warn('SchoolHome: No school found at all for slug:', slug);
        this.schoolState.currentSchool.set(null);
      }
    });
  }

  private formatSchoolData(doc: any) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      subscription: data.subscription
        ? {
            ...data.subscription,
            startsAt: data.subscription.startsAt?.toDate ? data.subscription.startsAt.toDate() : data.subscription.startsAt,
            endsAt: data.subscription.endsAt?.toDate ? data.subscription.endsAt.toDate() : data.subscription.endsAt
          }
        : null
    };
  }

  // Simple string difference metric (Levenshtein distance)
  private stringDiff(a: string, b: string) {
    if (a === b) return 0;
    let matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
    return matrix[b.length][a.length];
  }

  loadReviews(schoolId: string) {
    const reviewsCol = collection(this.firestore, `schools/${schoolId}/reviews`);
    const q = query(reviewsCol, orderBy('createdAt', 'desc'), limit(20));
    
    this.reviews$ = new Observable(subscriber => {
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const reviews: DocumentData[] = [];
        querySnapshot.forEach((reviewDoc) => {
          reviews.push({ id: reviewDoc.id, ...reviewDoc.data() });
        });
        subscriber.next(reviews);
      }, (error) => {
        console.error("Error fetching reviews:", error);
        subscriber.error(error);
      });
      return () => unsubscribe();
    });
  }

  async submitReview() {
    if (this.reviewForm.invalid || !this.currentUser || !this.schoolData) {
      return;
    }

    this.submittingReview = true;
    const schoolId = this.schoolData.id;
    const schoolRef = doc(this.firestore, `schools/${schoolId}`);
    const reviewsCol = collection(this.firestore, `schools/${schoolId}/reviews`);

    const newReview = {
      userId: this.currentUser.uid,
      userName: this.currentUser.displayName || 'Anonymous',
      userEmail: this.currentUser.email,
      userPhotoURL: this.currentUser.photoURL,
      userRole: 'User', // You might want to get the actual role from your user profile
      rating: this.reviewForm.value.rating,
      comment: this.reviewForm.value.comment,
      createdAt: new Date()
    };

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const schoolDoc = await transaction.get(schoolRef);
        if (!schoolDoc.exists()) {
          throw "School document does not exist!";
        }

        // Add the new review
        const newReviewRef = await addDoc(reviewsCol, newReview);

        // Update the school's average rating and review count
        const schoolData = schoolDoc.data();
        const oldReviewCount = schoolData['reviewCount'] || 0;
        const oldAverageRating = schoolData['averageRating'] || 0;
        
        const newReviewCount = oldReviewCount + 1;
        const newAverageRating = ((oldAverageRating * oldReviewCount) + newReview.rating) / newReviewCount;

        transaction.update(schoolRef, {
          reviewCount: newReviewCount,
          averageRating: newAverageRating,
          replyCount: 0 // Initialize replyCount for the new review
        });
      });

      this.reviewForm.reset({ rating: 0, comment: '' });
    } catch (error) {
      console.error("Error submitting review: ", error);
      // Optionally, show an error message to the user
    } finally {
      this.submittingReview = false;
    }
  }

  toggleReplyForm(reviewId: string | null) {
    this.replyingTo = this.replyingTo === reviewId ? null : reviewId;
    this.replyForm.reset();
  }

  async submitReply(reviewId: string) {
    if (this.replyForm.invalid || !this.currentUser || !this.schoolData) {
      return;
    }

    this.submittingReply = true;
    const schoolId = this.schoolData.id;
    const reviewRef = doc(this.firestore, `schools/${schoolId}/reviews/${reviewId}`);
    const repliesCol = collection(reviewRef, 'replies');

    const newReply = {
      userId: this.currentUser.uid,
      userName: this.currentUser.displayName || 'Anonymous',
      userEmail: this.currentUser.email,
      userPhotoURL: this.currentUser.photoURL,
      userRole: 'User', // Consider fetching the actual user role
      comment: this.replyForm.value.replyComment,
      createdAt: new Date()
    };

    try {
      await runTransaction(this.firestore, async (transaction) => {
        const reviewDoc = await transaction.get(reviewRef);
        if (!reviewDoc.exists()) {
          throw "Parent review document does not exist!";
        }

        // Add the new reply
        await addDoc(repliesCol, newReply);

        // Update the replyCount on the review
        const oldReplyCount = reviewDoc.data()['replyCount'] || 0;
        transaction.update(reviewRef, { replyCount: oldReplyCount + 1 });
      });

      this.toggleReplyForm(null); // Close form
    } catch (error) {
      console.error("Error submitting reply:", error);
    } finally {
      this.submittingReply = false;
    }
  }

  toggleReplies(review: DocumentData) {
    review['showReplies'] = !review['showReplies'];
    if (review['showReplies'] && !review['replies']) {
      this.loadReplies(review);
    }
  }

  async loadReplies(review: DocumentData) {
    if (!this.schoolData) return;
    const schoolId = this.schoolData.id;
    const repliesCol = collection(this.firestore, `schools/${schoolId}/reviews/${review['id']}/replies`);
    const q = query(repliesCol, orderBy('createdAt', 'asc'));

    try {
      const querySnapshot = await getDocs(q);
      const replies: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        replies.push({ id: doc.id, ...doc.data() });
      });
      review['replies'] = replies;
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      // The onAuthStateChanged listener will automatically update the UI
    } catch (error) {
      console.error("Google login failed:", error);
    }
  }

  setupShareableLinks() {
    if (typeof window !== 'undefined') {
      this.currentUrl = window.location.href;
      const shareText = `Check out ${this.schoolData.name}: ${this.currentUrl}`;
      // Use the web API for broader compatibility
      this.whatsAppShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    }
  }

  async shareAsPdf() {
    this.generatingPdf = true;
    const modalContent = document.getElementById('share-modal-content-for-pdf');
    if (!modalContent) {
      console.error('Shareable content not found');
      this.generatingPdf = false;
      return;
    }

    try {
      // Use html2canvas to capture the content as an image
      const canvas = await html2canvas(modalContent, {
        scale: 2, // Increase scale for better quality
        useCORS: true // Important for external images like the logo
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth - 20; // with some margin
      const height = width / ratio;

      pdf.addImage(imgData, 'PNG', 10, 10, width, height);
      pdf.save(`${this.schoolData.slug || 'school'}-profile.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      this.generatingPdf = false;
    }
  }
}
