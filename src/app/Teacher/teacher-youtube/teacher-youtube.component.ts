import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../core/services/auth.service';
import { SchoolStateService } from '../../core/services/school-state.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface YoutubeVideo {
  id: string;
  video_link: string;
  class: string;
  subject: string;
  short_desc: string;
  teacherId: string;
  schoolId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Timestamp;
}

@Component({
  selector: 'app-teacher-youtube',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-youtube.component.html',
  styleUrls: ['./teacher-youtube.component.scss']
})
export class TeacherYoutubeComponent {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  public schoolState = inject(SchoolStateService);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  schoolId = computed(() => this.schoolState.currentSchool()?.id);

  youtubeVideoForm: FormGroup;
  isSubmittingYoutubeVideo = signal(false);
  approvedVideos = signal<YoutubeVideo[]>([]);
  pendingVideos = signal<YoutubeVideo[]>([]);
  isLoadingVideos = signal(false);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor() {
    this.youtubeVideoForm = this.fb.group({
      video_link: ['', [Validators.required, Validators.pattern(/^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/)]],
      class: ['', Validators.required],
      subject: ['', Validators.required],
      short_desc: ['', [Validators.maxLength(200)]],
    });

    effect(() => {
      const schoolId = this.schoolId();
      if (schoolId) {
        this.loadTeacherVideos();
      }
    });
  }

  async submitYoutubeVideo(): Promise<void> {
    if (this.youtubeVideoForm.invalid) {
      this.youtubeVideoForm.markAllAsTouched();
      this.errorMessage.set("Please fill in all required fields and ensure the YouTube link is valid.");
      return;
    }

    this.isSubmittingYoutubeVideo.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const teacherId = this.authService.currentUser?.uid;
      const schoolId = this.schoolId();
      if (!teacherId || !schoolId) {
        throw new Error("Authentication error: Teacher ID or School ID not found.");
      }

      // Fetch teacher's name to save with the video document
      const teacherDocRef = doc(this.firestore, `schools/${schoolId}/teachers/${teacherId}`);
      const teacherSnap = await getDoc(teacherDocRef);
      const teacherName = teacherSnap.data()?.['name'] || 'Unknown Teacher';

      const videoData = {
        ...this.youtubeVideoForm.value,
        teacherId: teacherId,
        teacherName: teacherName, // Add teacherName to the document
        schoolId: schoolId,
        status: 'pending',
        appliedAt: Timestamp.now()
      };

      await addDoc(collection(this.firestore, `schools/${schoolId}/teachers/${teacherId}/youtube`), videoData);
      this.successMessage.set("YouTube video submitted for approval!");
      this.youtubeVideoForm.reset();
      this.loadTeacherVideos(); // Reload videos to show new pending one
    } catch (error: any) {
      console.error("Error submitting YouTube video:", error);
      this.errorMessage.set("Failed to submit video. Please try again.");
    } finally {
      this.isSubmittingYoutubeVideo.set(false);
    }
  }

  async loadTeacherVideos(): Promise<void> {
    this.isLoadingVideos.set(true);
    try {
      const teacherId = this.authService.currentUser?.uid;
      const schoolId = this.schoolId();
      if (!teacherId || !schoolId) return;

      const q = query(collection(this.firestore, `schools/${schoolId}/teachers/${teacherId}/youtube`));
      const querySnapshot = await getDocs(q);
      const videos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YoutubeVideo));
      this.approvedVideos.set(videos.filter(v => v.status === 'approved'));
      this.pendingVideos.set(videos.filter(v => v.status === 'pending'));
    } catch (error) {
      console.error("Error loading teacher videos:", error);
      this.errorMessage.set("Failed to load your videos.");
    } finally {
      this.isLoadingVideos.set(false);
    }
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`) : '';
  }
}