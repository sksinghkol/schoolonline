import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { SchoolStateService } from '../../core/services/school-state.service';

/* ============================================================
   ✅ Leave Document Strong Typing
   ============================================================ */
export interface LeaveApplication {
  id: string;
  userId: string;
  userName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'Unapproved' | 'Pending' | 'Approved' | 'Rejected';
  appliedDate: any;
  attachmentUrl?: string;
  schoolId: string;
}

@Component({
  selector: 'app-it-leave',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './it-leave.html', // Keep the same template
  styleUrls: ['./it-leave.scss'] // Add the new stylesheet
})
export class ItLeave implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  private schoolState = inject(SchoolStateService);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);

  /* ============================================================
     ✅ Forms
     ============================================================ */
  leaveForm = this.fb.group({
    leaveType: ['', Validators.required],
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(10)]],
  });

  leaveFilterForm = this.fb.group({
    month: [new Date().getMonth()],
    year: [new Date().getFullYear()],
    status: ['all' as 'all' | LeaveApplication['status']]
  });

  /* ============================================================
     ✅ Component State
     ============================================================ */
  user: User | null = null;
  schoolId: string | null = null;

  myLeaves: LeaveApplication[] = [];
  filteredLeaves: LeaveApplication[] = [];

  availableMonths: { value: number; name: string }[] = [];
  availableYears: number[] = [];

  loading = false;
  message = '';
  error = '';

  leaveSummary = {
    month: { pending: 0, approved: 0, rejected: 0, total: 0 },
    year: { pending: 0, approved: 0, rejected: 0, total: 0 },
    allTime: { pending: 0, approved: 0, rejected: 0, total: 0 },
  };
  selectedFile: File | null = null;

  editing: LeaveApplication | null = null;

  private leavesUnsub?: () => void;
  private authUnsub?: () => void;
  private schoolSub?: any;
  private routeSub?: any;

  /* ============================================================
     ✅ INIT
     ============================================================ */
  ngOnInit() {
    this.schoolSub = this.schoolState.schoolId$.subscribe((sid) => {
      this.schoolId = sid;
      this.startLeaveListener();
    });

    this.routeSub = this.route.queryParamMap.subscribe((params: ParamMap) => {
      const sid = params.get('schoolId');
      const slug = params.get('schoolSlug') || params.get('schoolName');
      if (sid) this.schoolState.setSchoolId(sid);
      else if (slug) this.schoolState.setSchoolBySlug(slug);
    });

    this.authUnsub = onAuthStateChanged(this.auth, (u) => {
      this.user = u;
      this.startLeaveListener();
    });
  }

  ngOnDestroy() {
    this.leavesUnsub?.();
    this.authUnsub?.();
    this.schoolSub?.unsubscribe?.();
    this.routeSub?.unsubscribe?.();
  }

  /* ============================================================
     ✅ Firestore Listener (Correct for Option B)
     ============================================================ */
  private startLeaveListener() {
    if (!this.schoolId || !this.user) return;

    this.leavesUnsub?.();

    this.loading = true;

    const leaveRef = collection(
      this.firestore,
      `schools/${this.schoolId}/leave_applications`
    );

    const qRef = query(leaveRef, orderBy('appliedDate', 'desc'));

    this.leavesUnsub = onSnapshot(
      qRef,
      (snap) => {
        this.myLeaves = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) } as LeaveApplication))
          .filter(app => app.userId === this.user!.uid);

        this.populateFilters();
        this.calculateLeaveSummary(); // Calculate totals after leaves are loaded
        this.filterLeaves();
        this.loading = false;
      },
      (err) => {
        console.error('startLeaveListener error', err);
        this.error = 'Unable to load leave records: Missing or insufficient permissions.';
        this.loading = false;
      }
    );
  }

  /* ============================================================
     ✅ Select File
     ============================================================ */
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile = input.files[0];
  }

  /* ============================================================
     ✅ Upload Attachment
     ============================================================ */
  private async uploadAttachmentIfAny(): Promise<string> {
    if (!this.selectedFile || !this.schoolId || !this.user) return '';

    const storage = getStorage();
    const safe = this.selectedFile.name.replace(/\s+/g, '_');
    const path = `leave_attachments/${this.schoolId}/${this.user.uid}_${Date.now()}_${safe}`;

    const res = await uploadBytes(ref(storage, path), this.selectedFile);
    return await getDownloadURL(res.ref);
  }

  /* ============================================================
     ✅ Payload Builder
     ============================================================ */
  private leavePayload(
    status: LeaveApplication['status'],
    attachmentUrl: string
  ): Omit<LeaveApplication, 'id'> {
    const { leaveType, fromDate, toDate, reason } = this.leaveForm.value;

    return {
      leaveType: leaveType || '',
      fromDate: fromDate || '',
      toDate: toDate || '',
      reason: reason || '',
      userId: this.user!.uid,
      userName: this.user!.displayName || 'N/A',
      status,
      appliedDate: serverTimestamp(),
      attachmentUrl,
      schoolId: this.schoolId!,
    };
  }

  /* ============================================================
     ✅ Save as Draft (Unapproved)
     ============================================================ */
  async saveDraft() {
    this.leaveForm.markAllAsTouched();
    if (!this.leaveForm.valid) return;
    if (!this.user || !this.schoolId) return;

    try {
      const attachmentUrl = await this.uploadAttachmentIfAny();
      const payload = this.leavePayload('Unapproved', attachmentUrl);

      const colRef = collection(
        this.firestore,
        `schools/${this.schoolId}/leave_applications`
      );

      if (this.editing) {
        if (this.editing.status !== 'Unapproved') {
          this.error = 'Only Unapproved applications can be edited.';
          return;
        }
        await updateDoc(doc(colRef, this.editing.id), payload);
        this.message = 'Draft updated.';
      } else {
        await addDoc(colRef, payload);
        this.message = 'Draft saved.';
      }

      this.resetForm();
    } catch (err) {
      console.error(err);
      this.error = 'Could not save draft.';
    }

    return;
  }

  /* ============================================================
     ✅ Submit for Approval (Pending)
     ============================================================ */
  async submitForApproval() {
    this.leaveForm.markAllAsTouched();
    if (!this.leaveForm.valid) return;
    if (!this.user || !this.schoolId) return;

    try {
      const attachmentUrl = await this.uploadAttachmentIfAny();
      const payload = this.leavePayload('Pending', attachmentUrl);

      const colRef = collection(
        this.firestore,
        `schools/${this.schoolId}/leave_applications`
      );

      if (this.editing) {
        if (this.editing.status !== 'Unapproved') {
          this.error = 'This application cannot be edited anymore.';
          return;
        }
        await updateDoc(doc(colRef, this.editing.id), payload);
        this.message = 'Submitted for approval.';
      } else {
        await addDoc(colRef, payload);
        this.message = 'Submitted for approval.';
      }

      this.resetForm();
    } catch (err) {
      console.error(err);
      this.error = 'Could not submit.';
    }

    return;
  }

  /* ============================================================
     ✅ Start Editing
     ============================================================ */
  startEdit(app: LeaveApplication) {
    if (app.status !== 'Unapproved') {
      this.error = 'Only Unapproved applications can be edited.';
      return;
    }

    this.editing = app;

    this.leaveForm.patchValue({
      leaveType: app.leaveType,
      fromDate: app.fromDate,
      toDate: app.toDate,
      reason: app.reason
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

   /* ============================================================
     ✅ Confirm Delete Leave
     ============================================================ */
  confirmDeleteLeave(app: LeaveApplication) {
    if (!this.schoolId || !this.user) return;
    if (app.status !== 'Unapproved') {
      this.error = 'Only Unapproved applications can be deleted.';
      return;
    }

    if (confirm('Are you sure you want to delete this leave application? This action cannot be undone.')) {
      this.deleteLeave(app);
    }
  }
  /* ============================================================
     ✅ Delete Leave
     ============================================================ */
  async deleteLeave(app: LeaveApplication) {

    try {
      const refDoc = doc(
        this.firestore,
        `schools/${this.schoolId}/leave_applications/${app.id}`
      );
      await deleteDoc(refDoc);
      this.message = 'Deleted.';
    } catch (err) {
      console.error(err);
      this.error = 'Cannot delete.';
    }
  }

  /* ============================================================
     ✅ Filters
     ============================================================ */
  populateFilters() {
    const months = new Set<number>();
    const years = new Set<number>();

    this.myLeaves.forEach(app => {
      const d = app.appliedDate?.toDate?.() || new Date();
      months.add(d.getMonth());
      years.add(d.getFullYear());
    });

    this.availableMonths = [...months].map(m => ({
      value: m,
      name: new Date(0, m).toLocaleString('default', { month: 'long' })
    }));

    this.availableYears = [...years].sort((a, b) => b - a);
  }

  filterLeaves() {
    const { month, year, status } = this.leaveFilterForm.value;

    this.filteredLeaves = this.myLeaves.filter(app => {
      const d = app.appliedDate?.toDate?.() || new Date();
      const mOk = month === null ? true : d.getMonth() === month;
      const yOk = year === null ? true : d.getFullYear() === year;
      const sOk = status === 'all' ? true : app.status === status;
      return mOk && yOk && sOk;
    });
    this.calculateLeaveSummary(); // Recalculate totals based on filtered leaves
  }

  /* ============================================================
     ✅ Reset
     ============================================================ */
  resetForm() {
    this.leaveForm.reset();
    this.selectedFile = null;
    this.editing = null;
  }

  /* ============================================================
     ✅ Total Leave Days Calculation
     ============================================================ */
  calculateLeaveSummary() {
    const summary = {
      month: { pending: 0, approved: 0, rejected: 0, total: 0 },
      year: { pending: 0, approved: 0, rejected: 0, total: 0 },
      allTime: { pending: 0, approved: 0, rejected: 0, total: 0 },
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.filteredLeaves.forEach(app => {
      // We only want to summarize leaves with these statuses
      if (!['Pending', 'Approved', 'Rejected'].includes(app.status)) return;

      const from = new Date(app.fromDate);
      const to = new Date(app.toDate);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
      const statusKey = app.status.toLowerCase() as 'pending' | 'approved' | 'rejected';

      // All Time
      summary.allTime[statusKey] += diffDays;
      summary.allTime.total += diffDays;

      // This Year
      if (from.getFullYear() === currentYear) {
        summary.year[statusKey] += diffDays;
        summary.year.total += diffDays;
      }

      // This Month
      if (from.getFullYear() === currentYear && from.getMonth() === currentMonth) {
        summary.month[statusKey] += diffDays;
        summary.month.total += diffDays;
      }
    });

    this.leaveSummary = summary;
  }

  /* ============================================================
     ✅ Utilities for Template
     ============================================================ */
  formatDate(v: any) {
    const d = v?.toDate?.() || (v ? new Date(v) : null);
    return d ? d.toLocaleDateString() : '-';
  }

  badgeClass(st: LeaveApplication['status']) {
    switch (st) {
      case 'Unapproved': return 'bg-secondary';
      case 'Pending':    return 'bg-warning text-dark';
      case 'Approved':   return 'bg-success';
      case 'Rejected':   return 'bg-danger';
      default:           return 'bg-light text-dark';
    }
  }
}
