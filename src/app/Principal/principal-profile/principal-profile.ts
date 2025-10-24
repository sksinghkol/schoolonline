import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { serverTimestamp } from '@angular/fire/firestore';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { SchoolStateService } from '../../core/services/school-state.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-principal-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule, NgIf],
  templateUrl: './principal-profile.html',
  styleUrls: ['./principal-profile.scss']
})
export class PrincipalProfile implements OnInit {
  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  public schoolState = inject(SchoolStateService);
  private cloudinaryService = inject(CloudinaryService);

  profileForm: FormGroup;
  isLoading = true;
  isSaving = false;
  isUploading = false;
  isEditing = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  imagePreviewUrl: string | null = null;

  schoolId: string | null = null;
  principalId: string | null = null;
  principalDocRef: any;
  principalProfile: any = null;

  desktopStream: MediaStream | null = null;
  isDesktopCameraActive = false;
  isMobile = false;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link']
    ]
  };

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      photoURL: [''],
      message: ['', Validators.required],
      about_principal: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.detectDevice();
    this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    this.principalId = this.route.snapshot.queryParamMap.get('principalId');

    if (!this.schoolId || !this.principalId) {
      this.errorMessage = 'School or Principal ID is missing from the URL.';
      this.isLoading = false;
      return;
    }

    this.principalDocRef = doc(this.firestore, `schools/${this.schoolId}/principals/${this.principalId}`);
    this.loadPrincipalProfile();
  }

  detectDevice() {
    const userAgent = navigator.userAgent;
    this.isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(userAgent);
  }

  async loadPrincipalProfile(force = false) {
    this.isLoading = true;
    this.errorMessage = null;
    const timeout = 15000; // 15 seconds

    try {
      const docSnapPromise = getDoc(this.principalDocRef);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout));
      const docSnap = await Promise.race([docSnapPromise, timeoutPromise]) as any;

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.principalProfile = data;
        this.profileForm.patchValue({
          name: data.name || '',
          phone: data.phone || '',
          photoURL: data.photoURL || '',
          message: data.message || '',
          about_principal: data.about_principal || ''
        });
        this.imagePreviewUrl = data.photoURL || null;
      } else {
        this.errorMessage = force ? 'Principal profile not found.' : 'Principal profile not found. This might be a new profile.';
      }
    } catch (error: any) {
      this._handleError(error, 'load');
    } finally {
      this.isLoading = false;
    }
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
    this.imagePreviewUrl = this.principalProfile?.photoURL || null;
    this.profileForm.patchValue({ photoURL: this.principalProfile?.photoURL || '' });
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
    const videoElement = this.videoPreview.nativeElement;
    if (videoElement) {
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
    const formData = this.profileForm.value;

    try {
      await updateDoc(this.principalDocRef, formData);
      this.principalProfile = { ...this.principalProfile, ...formData };
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
    if (this.principalProfile) {
      this.profileForm.patchValue(this.principalProfile);
      this.imagePreviewUrl = this.principalProfile.photoURL || null;
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.profileForm.reset({
      name: this.principalProfile?.name || '',
      phone: this.principalProfile?.phone || '',
      photoURL: this.principalProfile?.photoURL || '',
      message: this.principalProfile?.message || '',
      about_principal: this.principalProfile?.about_principal || ''
    });
    this.imagePreviewUrl = this.principalProfile?.photoURL || null;
    this.stopDesktopCamera();
  }

  backToDashboard() {
    this.router.navigate(['/principal-dashboard'], { queryParams: { schoolId: this.schoolId, principalId: this.principalId } });
  }

  async retryLoad() {
    await this.loadPrincipalProfile(true);
  }

  private _handleError(error: any, context: 'load' | 'upload') {
    console.error(`Error during ${context}:`, error);
    const isTimeout = error.message?.toLowerCase().includes('timed out');
    if (context === 'upload') {
      this.imagePreviewUrl = this.profileForm.value.photoURL || this.principalProfile?.photoURL || null;
      this.errorMessage = isTimeout ? 'Upload timed out. Please try a smaller file or check your connection.' : 'Image upload failed. Please try again.';
    } else {
      this.errorMessage = isTimeout ? 'Request timed out. Please check your internet connection.' : `Failed to ${context} profile. Please try again.`;
    }
  }
}