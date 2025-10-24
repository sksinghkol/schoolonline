import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, getDocs, addDoc, query, orderBy, limit, where } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { SchoolStateService } from '../../core/services/school-state.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIf, NgFor],
  templateUrl: './teacher-profile.html',
  styleUrls: ['./teacher-profile.scss']
})
export class TeacherProfile implements OnInit {
  @ViewChild('videoPreview', { static: false }) videoPreview!: ElementRef<HTMLVideoElement>;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  public schoolState = inject(SchoolStateService);
  private authService = inject(AuthService);
  private cloudinaryService = inject(CloudinaryService);
  private cdr = inject(ChangeDetectorRef);

  profileForm: FormGroup;
  isLoading = true;
  isSaving = false;
  isUploading = false;
  isEditing = false;
  isApplyingForIdCard = false;
  idCardApplication: any = null;
  visitingCardApplication: any = null;

  // Visiting Card Application State
  isVisitingCardModalVisible = false;
  isLoadingVisitingCards = false;
  isSubmittingVisitingCard = false;
  visitingCards: any[] = [];
  selectedVisitingCard: any = null;
  visitingCardQuantity = 100; // Default quantity

  errorMessage: string | null = null;
  successMessage: string | null = null;
  imagePreviewUrl: string | null = null;

  schoolId: string | null = null;
  teacherId: string | null = null;
  teacherDocRef: any;
  teacherProfile: any = null;

  desktopStream: MediaStream | null = null;
  isDesktopCameraActive = false;
  isMobile = false;

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      photoURL: [''],
      gender: [''],
      marital_status: [''],
      father_or_husband_name: [''],
      mobile_no: [''],
      whatsapp_no: [''],
      qualification: [''],
      dob: [''],
      blood_group: [''],
      doj: [''],
      designation: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.detectDevice();
    this.schoolId = this.schoolState.currentSchool()?.id ?? null;
    this.teacherId = this.authService.currentUser?.uid ?? null;

    if (!this.schoolId || !this.teacherId) {
      this.errorMessage = 'Could not identify the current school or teacher. Please log in again.';
      this.isLoading = false;
      return;
    }

    this.teacherDocRef = doc(this.firestore, `schools/${this.schoolId}/teachers/${this.teacherId}`);
    this.loadTeacherProfile();
    this.loadIdCardApplicationStatus();
    this.loadVisitingCardApplicationStatus();
    this.loadVisitingCards(); // Pre-load visiting cards
  }

  detectDevice() {
    const userAgent = navigator.userAgent;
    this.isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(userAgent);
  }

  async loadTeacherProfile(force = false) {
    this.isLoading = true;
    this.errorMessage = null;
    const timeout = 15000; // 15 seconds

    try {
      const docSnapPromise = getDoc(this.teacherDocRef);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout));
      const docSnap = await Promise.race([docSnapPromise, timeoutPromise]) as any;

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.teacherProfile = data;
        this.profileForm.patchValue({
          name: data.name || '',
          photoURL: data.photoURL || '',
          gender: data.gender || '',
          marital_status: data.marital_status || '',
          father_or_husband_name: data.father_name || data.husband_name || '',
          mobile_no: data.mobile_no || '',
          whatsapp_no: data.whatsapp_no || '',
          qualification: data.qualification || '',
          dob: data.dob || '',
          blood_group: data.blood_group || '',
          doj: data.doj || '',
          designation: data.designation || '',
          address: data.address || ''
        });
        this.imagePreviewUrl = data.photoURL || null;
      } else {
        this.errorMessage = force ? 'Teacher profile not found.' : 'Teacher profile not found. This might be a new profile.';
      }
    } catch (error: any) {
      this._handleError(error, 'load');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadVisitingCards() {
    this.isLoadingVisitingCards = true;
    try {
      const cardsCollection = collection(this.firestore, 'visiting_cards');
      const querySnapshot = await getDocs(cardsCollection);
      this.visitingCards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching visiting cards:", error);
      this.errorMessage = "Could not load visiting card designs. Please try again later.";
    } finally {
      this.isLoadingVisitingCards = false;
    }
  }

  async loadIdCardApplicationStatus() {
    if (!this.schoolId || !this.teacherId) return;
    // Query the subcollection for the latest application
    const q = query(
      collection(this.firestore, `schools/${this.schoolId}/teachers/${this.teacherId}/id_card_applications`),
      orderBy('appliedAt', 'desc'),
      limit(1)
    );
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        this.idCardApplication = querySnapshot.docs[0].data();
      } else {
        this.idCardApplication = null;
      }
    } catch (error) {
      console.error("Error fetching ID card application status:", error); // This will now work
    }
  }

  async loadVisitingCardApplicationStatus() {
    if (!this.schoolId || !this.teacherId) return;
    const q = query(
      collection(this.firestore, `schools/${this.schoolId}/teachers/${this.teacherId}/visiting_applications`),
      orderBy('appliedAt', 'desc'),
      limit(1)
    );
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        this.visitingCardApplication = querySnapshot.docs[0].data();
      }
    } catch (error) { console.error("Error fetching visiting card application status:", error); }
  }

  async onFileSelected(event: Event, isCapture: boolean = false) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      target.value = ''; // Reset file input

      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreviewUrl = e.target.result;
      reader.readAsDataURL(file);

      this.isUploading = true;
      this.errorMessage = null;
      this.successMessage = null;
      const timeout = 30000; // 30 seconds

      try {
        const uploadPromise = this.cloudinaryService.uploadImage(file);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timed out')), timeout));
        const photoURL = await Promise.race([uploadPromise, timeoutPromise]) as string;

        this.profileForm.patchValue({ photoURL });
        this.successMessage = `Image ${isCapture ? 'captured' : 'uploaded'} successfully. Click Save Profile to apply changes.`;
      } catch (error: any) {
        this._handleError(error, 'upload');
      } finally {
        this.isUploading = false;
      }
    }
  }

  resetPhoto() {
    this.imagePreviewUrl = this.teacherProfile?.photoURL || null;
    this.profileForm.patchValue({ photoURL: this.teacherProfile?.photoURL || '' });
  }

  async startDesktopCamera() {
    try {
      this.desktopStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const videoElement = this.videoPreview.nativeElement;
      videoElement.srcObject = this.desktopStream;
      videoElement.play();
      this.isDesktopCameraActive = true;
      videoElement.classList.remove('d-none');
    } catch (err) {
      console.error("Camera access denied or not available", err);
      this.errorMessage = "Webcam not available or permission denied.";
    }
  }

  stopDesktopCamera() {
    if (this.desktopStream) {
      this.desktopStream.getTracks().forEach(track => track.stop());
      this.desktopStream = null;
    }
    this.isDesktopCameraActive = false;
    if (this.videoPreview) {
      const videoElement = this.videoPreview.nativeElement;
      videoElement.srcObject = null;
      videoElement.classList.add('d-none');
    }
  }

  captureDesktopPhoto() {
    if (!this.desktopStream || !this.videoPreview) return;
    const video = this.videoPreview.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    this.imagePreviewUrl = canvas.toDataURL('image/png');
    this.profileForm.patchValue({ photoURL: this.imagePreviewUrl });
    this.successMessage = 'Photo captured successfully. Click Save Profile to upload.';
    this.stopDesktopCamera();
  }

  async onSubmit() {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please fill all required fields.';
      return;
    }
    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { father_or_husband_name, gender, marital_status, ...rest } = this.profileForm.value;

    const dataToSave: { [key: string]: any } = { ...rest };

    if (gender === 'Female' && marital_status === 'Married') {
      dataToSave['husband_name'] = father_or_husband_name;
      dataToSave['father_name'] = null; // Ensure the other field is cleared
    } else {
      dataToSave['father_name'] = father_or_husband_name;
      dataToSave['husband_name'] = null; // Ensure the other field is cleared
    }

    try {
      await updateDoc(this.teacherDocRef, dataToSave);
      this.teacherProfile = { ...this.teacherProfile, ...dataToSave };
      this.successMessage = 'Profile updated successfully!';
      this.isEditing = false;
      setTimeout(() => this.successMessage = null, 3000);
    } catch (error) {
      console.error('Update failed', error);
      this.errorMessage = 'Failed to update profile. Please try again.';
    } finally {
      this.isSaving = false;
    }
  }

  toggleEdit() {
    this.isEditing = true;
    this.errorMessage = null;
    this.successMessage = null;
    if (this.teacherProfile) {
      this.profileForm.patchValue(this.teacherProfile);
      this.imagePreviewUrl = this.teacherProfile.photoURL || null;
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.profileForm.reset(this.teacherProfile || {});
    this.imagePreviewUrl = this.teacherProfile?.photoURL || null;
    this.stopDesktopCamera();
  }

  backToDashboard() {
    this.router.navigate(['/teacher-dashboard'], { queryParams: { schoolId: this.schoolId, teacherId: this.teacherId } });
  }

  async retryLoad() {
    await this.loadTeacherProfile(true);
  }

  openVisitingCardModal() {
    this.isVisitingCardModalVisible = true;
    this.selectedVisitingCard = null; // Reset selection
    this.visitingCardQuantity = 100; // Reset quantity
    this.successMessage = null;
    this.errorMessage = null;
  }

  closeVisitingCardModal() {
    this.isVisitingCardModalVisible = false;
  }

  selectVisitingCard(card: any) {
    this.selectedVisitingCard = card;
  }

  async submitVisitingCardApplication() {
    if (!this.selectedVisitingCard) {
      this.errorMessage = "Please select a visiting card design.";
      return;
    }

    if (!this.teacherProfile || !this.schoolId || !this.teacherId) {
      this.errorMessage = "Profile data is not loaded yet. Please wait.";
      return;
    }

    this.isSubmittingVisitingCard = true;
    this.errorMessage = null;
    this.successMessage = null;

    const applicationCollection = collection(this.firestore, `schools/${this.schoolId}/teachers/${this.teacherId}/visiting_applications`);

    const applicationData = {
      teacherId: this.teacherId,
      teacherName: this.teacherProfile.name,
      cardId: this.selectedVisitingCard.id,
      cardName: this.selectedVisitingCard.card_name,
      quantity: this.visitingCardQuantity,
      totalPrice: this.selectedVisitingCard.price * this.visitingCardQuantity,
      status: 'for approval',
      appliedAt: serverTimestamp()
    };

    try {
      await addDoc(applicationCollection, applicationData);
      this.successMessage = "Your visiting card application has been submitted successfully!";
      // Immediately update the local state to reflect the new application
      this.visitingCardApplication = {
        ...applicationData,
        appliedAt: new Date() // Use a local date for immediate UI feedback
      };
      setTimeout(() => this.closeVisitingCardModal(), 2000);
    } catch (error) {
      this.errorMessage = "Failed to submit your application. Please try again.";
      console.error("Error applying for visiting card:", error);
    } finally {
      this.isSubmittingVisitingCard = false;
    }
  }

  async applyForIdCard() {
    if (!this.teacherProfile || !this.schoolId || !this.teacherId) {
      this.errorMessage = "Profile data is not loaded yet. Please wait.";
      return;
    }

    this.isApplyingForIdCard = true;
    this.successMessage = null;
    this.errorMessage = null;

    // Use the correct subcollection path that matches the security rules
    const applicationCollection = collection(this.firestore, `schools/${this.schoolId}/teachers/${this.teacherId}/id_card_applications`);
    const applicationData = {
      teacherId: this.teacherId,
      teacherName: this.teacherProfile.name,
      photoURL: this.teacherProfile.photoURL, // Include relevant data
      status: 'for approval',
      appliedAt: serverTimestamp()
    };

    try {
      await addDoc(applicationCollection, applicationData);
      // Immediately update the local state to reflect the new application
      this.idCardApplication = {
        ...applicationData,
        appliedAt: new Date() // Use a local date for immediate UI feedback
      };
      this.successMessage = "Your ID card application has been submitted successfully!";
    } catch (error) {
      this.errorMessage = "Failed to submit your application. Please try again.";
      console.error("Error applying for ID card:", error);
    } finally {
      this.isApplyingForIdCard = false;
    }
  }

  private _handleError(error: any, context: 'load' | 'upload') {
    console.error(`Error during ${context}:`, error);
    const isTimeout = error.message?.toLowerCase().includes('timed out');
    if (context === 'upload') {
      this.imagePreviewUrl = this.profileForm.value.photoURL || this.teacherProfile?.photoURL || null;
      this.errorMessage = isTimeout ? 'Upload timed out. Please try a smaller file or check your connection.' : 'Image upload failed. Please try again.';
    } else {
      this.errorMessage = isTimeout ? 'Request timed out. Please check your internet connection.' : `Failed to ${context} profile. Please try again.`;
    }
  }
}