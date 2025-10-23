import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { SchoolStateService } from '../../core/services/school-state.service';
import { AuthService } from '../../core/services/auth.service';
import { CloudinaryService } from '../../core/services/cloudinary.service';

interface DirectorProfileData {
  name?: string;
  phone?: string;
  photoURL?: string;
  message?: string;
  about_director?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-director-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './director-profile.html',
  styleUrls: ['./director-profile.scss']
})
export class DirectorProfile implements OnInit {
  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private schoolState = inject(SchoolStateService);
  private cloudinaryService = inject(CloudinaryService);

  profileForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  isUploading = false;
  isEditing = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  imagePreviewUrl: string | null = null;

  private schoolId: string | null = null;
  private directorId: string | null = null;
  private directorDocRef: any;
  directorProfile: DirectorProfileData | null = null;

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
      about_director: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.detectDevice();
    this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    this.directorId = this.route.snapshot.queryParamMap.get('directorId');

    if (!this.schoolId || !this.directorId) {
      this.errorMessage = "School or Director ID is missing from the URL.";
      this.isLoading = false;
      return;
    }

    this.directorDocRef = doc(this.firestore, `schools/${this.schoolId}/directors/${this.directorId}`);
    this.loadDirectorProfile();
  }

  detectDevice() {
    const ua = navigator.userAgent;
    this.isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
  }

  async loadDirectorProfile(retry = false) {
    this.isLoading = true;
    this.errorMessage = null;
    const timeout = 15000;
    try {
      const docPromise = getDoc(this.directorDocRef);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
      );

      const docSnap = await Promise.race([docPromise, timeoutPromise]);

      if (docSnap.exists()) {
        const data = docSnap.data() as DirectorProfileData;
        this.directorProfile = data;
        this.profileForm.patchValue({
          name: data.name || '',
          phone: data.phone || '',
          photoURL: data.photoURL || '',
          message: data.message || '',
          about_director: data.about_director || ''
        });
        this.imagePreviewUrl = data.photoURL || null;
      } else {
        if (!retry) {
          this.errorMessage = "Director profile not found. This might be a new profile.";
        } else {
          this.errorMessage = "Director profile not found.";
        }
      }
    } catch (error: any) {
      this._handleError(error, 'load');
    } finally {
      this.isLoading = false;
    }
  }

  // Unified file selection for gallery or camera capture
  async onFileSelected(event: Event, isCamera = false) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      input.value = '';

      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreviewUrl = e.target.result;
      reader.readAsDataURL(file);

      this.isUploading = true;
      this.errorMessage = null;
      this.successMessage = null;
      const uploadTimeout = 30000;
      try {
        const photoUrl = await Promise.race([
          this.cloudinaryService.uploadImage(file),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Upload timed out')), uploadTimeout)
          )
        ]);
        this.profileForm.patchValue({ photoURL: photoUrl });
        this.successMessage = `Image ${isCamera ? 'captured' : 'uploaded'} successfully. Click Save Profile to apply changes.`;
      } catch (error: any) {
        this._handleError(error, 'upload');
      } finally {
        this.isUploading = false;
      }
    }
  }

  // Desktop webcam
  async startDesktopCamera() {
    try {
      this.desktopStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const video = this.videoPreview.nativeElement;
      video.srcObject = this.desktopStream;
      video.play();
      this.isDesktopCameraActive = true;
      video.classList.remove('d-none');
    } catch (err) {
      console.error('Camera access denied or not available', err);
      this.errorMessage = 'Webcam not available or permission denied.';
    }
  }

  stopDesktopCamera() {
    if (this.desktopStream) {
      this.desktopStream.getTracks().forEach(track => track.stop());
      this.desktopStream = null;
    }
    this.isDesktopCameraActive = false;
    const video = this.videoPreview.nativeElement;
    if (video) {
      video.srcObject = null;
      video.classList.add('d-none');
    }
  }

  captureDesktopPhoto() {
    if (!this.desktopStream || !this.videoPreview) return;
    const video = this.videoPreview.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.imagePreviewUrl = canvas.toDataURL('image/png');
      // For preview only; upload will happen on form submit if needed, or simulate upload
      this.profileForm.patchValue({ photoURL: this.imagePreviewUrl });
      this.successMessage = 'Photo captured successfully. Click Save Profile to upload.';
    }
    this.stopDesktopCamera();
  }

  resetPhoto() {
    this.imagePreviewUrl = this.directorProfile?.photoURL || null;
    this.profileForm.patchValue({ photoURL: this.directorProfile?.photoURL || '' });
    this.stopDesktopCamera();
  }

  async onSubmit() {
    if (this.profileForm.invalid) {
      this.errorMessage = "Please fill all required fields.";
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const updatedData = this.profileForm.value;

    try {
      await updateDoc(this.directorDocRef, updatedData);
      this.directorProfile = { ...this.directorProfile, ...updatedData };
      this.successMessage = "Profile updated successfully!";
      this.isEditing = false;
      setTimeout(() => this.successMessage = null, 3000);
    } catch (error) {
      console.error("Update failed", error);
      this.errorMessage = "Failed to update profile. Please try again.";
    } finally {
      this.isSaving = false;
    }
  }

  toggleEdit(): void {
    this.isEditing = true;
    this.errorMessage = null;
    this.successMessage = null;
    if (this.directorProfile) {
      this.profileForm.patchValue(this.directorProfile);
      this.imagePreviewUrl = this.directorProfile.photoURL || null;
    }
    this.stopDesktopCamera(); // Ensure camera is stopped on edit toggle
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.profileForm.reset({
      name: this.directorProfile?.name || '',
      phone: this.directorProfile?.phone || '',
      photoURL: this.directorProfile?.photoURL || '',
      message: this.directorProfile?.message || '',
      about_director: this.directorProfile?.about_director || ''
    });
    this.imagePreviewUrl = this.directorProfile?.photoURL || null;
    this.stopDesktopCamera();
  }

  backToDashboard() {
    this.router.navigate(['/director-dashboard'], {
      queryParams: { schoolId: this.schoolId, directorId: this.directorId }
    });
  }

  async retryLoad() {
    await this.loadDirectorProfile(true);
  }

  private _handleError(error: any, context: 'load' | 'upload' | 'save') {
    console.error(`Error during ${context}:`, error);
    const isTimeout = error.message?.toLowerCase().includes('timed out');
    
    if (context === 'upload') {
      this.imagePreviewUrl = this.profileForm.value.photoURL || this.directorProfile?.photoURL || null;
      this.errorMessage = isTimeout
        ? 'Upload timed out. Please try a smaller file or check your connection.'
        : 'Image upload failed. Please try again.';
    } else {
      this.errorMessage = isTimeout ? 'Request timed out. Please check your internet connection.' : `Failed to ${context} profile. Please try again.`;
    }
  }
}