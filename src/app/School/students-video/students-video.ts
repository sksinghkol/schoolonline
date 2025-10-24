import { Component, inject, effect, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Firestore, collectionGroup, query, where, getDocs, doc, getDoc, DocumentData, orderBy, QueryConstraint, limit, startAfter, getCountFromServer, Query } from '@angular/fire/firestore';
import { SchoolStateService } from '../../core/services/school-state.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface YoutubeVideo extends DocumentData {
  id: string;
  video_link: string;
  class: string;
  subject: string;
  short_desc: string;
  teacherId: string;
  teacherName?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: any;
}

interface TeacherFilter {
  id: string;
  name: string;
}

@Component({
  selector: 'app-students-video',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './students-video.html',
  styleUrl: './students-video.scss'
})
export class StudentsVideo {
  private firestore = inject(Firestore);
  public schoolState = inject(SchoolStateService);
  private sanitizer = inject(DomSanitizer);

  schoolId = computed(() => this.schoolState.currentSchool()?.id);
  approvedVideos = signal<YoutubeVideo[]>([]);
  isLoading = signal(true);
  isLoadingFilters = signal(true);
  error = signal<string | null>(null);

  // Filter signals
  selectedClass = signal<string | null>(null);
  selectedSubject = signal<string | null>(null);
  selectedTeacherId = signal<string | null>(null);

  // Pagination signals
  pageSize = 10;
  currentPage = signal(1);
  lastDoc = signal<DocumentData | null>(null);
  isLastPage = signal(false);
  totalVideos = signal(0);
  private pageStartSnapshots: (DocumentData | null)[] = [null];

  // Signals for filter dropdown options and statistics
  allApprovedVideosWithTeachers = signal<YoutubeVideo[]>([]);
  availableClasses = computed(() => this.getUniqueValuesFor('class'));
  availableSubjects = computed(() => this.getUniqueValuesFor('subject'));
  availableTeachers = computed(() => this.getUniqueTeachers());

  videoCountByClass = computed(() => this.getCountsFor('class'));
  videoCountBySubject = computed(() => this.getCountsFor('subject'));
  videoCountByTeacher = computed(() => this.getCountsFor('teacherName'));

  private teacherCache = new Map<string, string>();

  constructor() {
    effect(() => {
      const currentSchoolId = this.schoolId();
      if (currentSchoolId) {
        console.log('Effect triggered: currentSchoolId is', currentSchoolId);
        // Load all videos for filters and stats first.
        this.loadAllVideosForFilters(currentSchoolId).then(() => {
          // Once filters are loaded, load the first page of videos.
          // This will also re-run when any filter signal changes.
          this.loadApprovedVideos(currentSchoolId, this.selectedClass(), this.selectedSubject(), this.selectedTeacherId(), 'first');
        });
      }
    });
  }

  private getUniqueValuesFor(field: keyof YoutubeVideo): string[] {
    const values = this.allApprovedVideosWithTeachers().map(v => v[field]);
    return ['All', ...[...new Set(values)].filter(Boolean).sort()];
  }

  private getUniqueTeachers(): TeacherFilter[] {
    const teacherMap = new Map<string, string>();
    for (const video of this.allApprovedVideosWithTeachers()) {
      if (video.teacherId && video.teacherName) {
        teacherMap.set(video.teacherId, video.teacherName);
      }
    }
    return Array.from(teacherMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }

  private getCountsFor(field: keyof YoutubeVideo): Map<string, number> {
    const counts = new Map<string, number>();
    for (const video of this.allApprovedVideosWithTeachers()) {
      const key = video[field] as string;
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    }
    return new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
  }

  async loadAllVideosForFilters(schoolId: string): Promise<void> {
    console.log('loadAllVideosForFilters called for schoolId:', schoolId);
    this.isLoadingFilters.set(true);
    try {
      const youtubeCollectionGroup = collectionGroup(this.firestore, 'youtube');
      const q = query(youtubeCollectionGroup, where('schoolId', '==', schoolId), where('status', '==', 'approved'));
      console.log('loadAllVideosForFilters query:', q);
      const querySnapshot = await getDocs(q);
      const videos = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as YoutubeVideo));

      const uniqueTeacherIds = new Set<string>(videos.map(v => v.teacherId).filter(Boolean));
      const teacherPromises: Promise<void>[] = [];
      for (const teacherId of uniqueTeacherIds) {
        if (!this.teacherCache.has(teacherId)) {
          const teacherDocRef = doc(this.firestore, `schools/${schoolId}/teachers/${teacherId}`);
          teacherPromises.push(
            getDoc(teacherDocRef).then(teacherSnap => {
              this.teacherCache.set(teacherId, teacherSnap.data()?.['name'] || 'Unknown Teacher');
            })
          );
        }
      }
      await Promise.all(teacherPromises);

      const videosWithTeacherNames = videos.map(video => ({
        ...video,
        teacherName: video.teacherId ? this.teacherCache.get(video.teacherId) : 'Unknown Teacher'
      }));

      this.allApprovedVideosWithTeachers.set(videosWithTeacherNames);
    } catch (err) {
      console.error("Error fetching data for filters:", err); // Log the full error object
      this.error.set("Could not load filter options.");
    } finally {
      this.isLoadingFilters.set(false);
    }
  }

  async loadApprovedVideos(schoolId: string, vClass: string | null, subject: string | null, teacherId: string | null, direction: 'first' | 'next' | 'prev'): Promise<void> { // Removed 'teacher' parameter
    console.log('loadApprovedVideos called with:', { schoolId, vClass, subject, teacherId, direction });
    this.isLoading.set(true);
    this.error.set(null);
    console.log('Current pagination state before load:', { currentPage: this.currentPage(), lastDoc: this.lastDoc(), pageStartSnapshots: this.pageStartSnapshots });
    if (direction === 'first') this.resetPagination();

    try {
      const youtubeCollectionGroup = collectionGroup(this.firestore, 'youtube');
      const queryConstraints: QueryConstraint[] = [
        where('schoolId', '==', schoolId),
        where('status', '==', 'approved')
      ];

      if (vClass && vClass !== 'All') queryConstraints.push(where('class', '==', vClass));
      if (subject && subject !== 'All') queryConstraints.push(where('subject', '==', subject));
      if (teacherId && teacherId !== 'All') queryConstraints.push(where('teacherId', '==', teacherId));
      console.log('Query constraints for loadApprovedVideos:', queryConstraints);

      if (direction === 'first') {
        const countQuery = query(youtubeCollectionGroup, ...queryConstraints);
        const countSnapshot = await getCountFromServer(countQuery);
        console.log('Total videos count:', countSnapshot.data().count);
        this.totalVideos.set(countSnapshot.data().count);
      }

      queryConstraints.push(orderBy('appliedAt', 'desc'));

      let paginatedQuery: Query<DocumentData>;
      switch (direction) {
        case 'next':
          if (this.lastDoc()) {
            queryConstraints.push(startAfter(this.lastDoc()));
            console.log('Pagination: starting after lastDoc', this.lastDoc());
          }
          break;
        case 'prev':
          const prevPageStart = this.pageStartSnapshots[this.currentPage() - 2] || null;
          if (prevPageStart) {
            queryConstraints.push(startAfter(prevPageStart));
            console.log('Pagination: starting after prevPageStart', prevPageStart);
          }
          break;
      }
      queryConstraints.push(limit(this.pageSize));
      paginatedQuery = query(youtubeCollectionGroup, ...queryConstraints); // Re-create query with pagination

      const querySnapshot = await getDocs(paginatedQuery);
      this.isLastPage.set(querySnapshot.docs.length < this.pageSize);
      this.lastDoc.set(querySnapshot.docs[querySnapshot.docs.length - 1] || null);

      const videos = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as YoutubeVideo));
      const videosWithTeacherNames = videos.map(video => ({
        ...video,
        teacherName: video.teacherId ? this.teacherCache.get(video.teacherId) : 'Unknown Teacher'
      }));

      if (direction === 'next' && this.lastDoc() && !this.pageStartSnapshots[this.currentPage()]) {
        this.pageStartSnapshots.push(this.lastDoc());
      }
      console.log('Fetched videos count for current page:', videosWithTeacherNames.length);
      console.log('New pagination state after load:', { currentPage: this.currentPage(), lastDoc: this.lastDoc(), pageStartSnapshots: this.pageStartSnapshots, isLastPage: this.isLastPage() });
      this.approvedVideos.set(videosWithTeacherNames);
    } catch (err: any) {
      console.error("Error fetching approved videos:", err);
      if (err.code === 'failed-precondition') {
        this.error.set("A database index is required for this filter combination. Please check the browser console for a link to create it.");
      } else {
        this.error.set("Could not load videos. An unexpected error occurred.");
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  goToNextPage(): void {
    if (this.isLastPage()) return;
    this.currentPage.update(page => page + 1);
    const schoolId = this.schoolId();
    if (schoolId) {
      this.loadApprovedVideos(schoolId, this.selectedClass(), this.selectedSubject(), this.selectedTeacherId(), 'next');
    }
  }

  goToPrevPage(): void {
    if (this.currentPage() === 1) return;
    this.currentPage.update(page => page - 1);
    const schoolId = this.schoolId();
    if (schoolId) {
      this.loadApprovedVideos(schoolId, this.selectedClass(), this.selectedSubject(), this.selectedTeacherId(), 'prev');
    }
  }

  private resetPagination(): void {
    this.currentPage.set(1);
    this.lastDoc.set(null);
    this.pageStartSnapshots = [null];
  }

  onClassChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedClass.set(value === 'All' ? null : value);
    console.log('Class filter changed to:', this.selectedClass());
  }

  onSubjectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedSubject.set(value === 'All' ? null : value);
    console.log('Subject filter changed to:', this.selectedSubject());
  }

  onTeacherChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedTeacherId.set(value === 'All' ? null : value);
    console.log('Teacher filter changed to:', this.selectedTeacherId());
  }

  clearFilters(): void {
    this.selectedClass.set(null);
    this.selectedSubject.set(null);
    this.selectedTeacherId.set(null);
    this.resetPagination();
    console.log('Filters cleared.');
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`) : '';
  }
}
