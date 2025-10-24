import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { collection, Firestore, getDocs, query, where, limit } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuillModule } from 'ngx-quill';

interface Staff {
  id: string;
  name: string;
  photoURL?: string;
  designation?: string;
  email?: string;
  role: string; // e.g., 'director', 'principal', 'teacher', 'staff'
  status: string; // e.g., 'approved', 'waiting-approval'
  message?: string;
  about_role?: string; // Generic for about_director, about_principal, etc.
}

interface School {
  id: string;
  name?: string;
  slug?: string;
  logoUrl?: string;
  address?: string;
   designation?: string;
}

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, QuillModule,  FormsModule],
  templateUrl: './staff-list.html',
  styleUrls: ['./staff-list.scss']
})
export class StaffList implements OnInit {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  staffByRole: { role: string, members: Staff[] }[] = [];
  filteredStaffByRole: { role: string, members: Staff[] }[] = [];
  schoolData: School | null = null;
  isLoading = true;
  error: string | null = null;
  selectedRole: string = 'all';
  roleFilters: { value: string, name: string }[] = [];

  // Define all possible staff-related collections
  private staffCollections = [
   
   
    'teachers',
    'staffs',
    'frontdesks',
    'securitys',
    'transports',
    'itdepartments',
    'accounts'
  ];

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(async (params) => {
      const schoolSlug = params.get('schoolName');
      if (schoolSlug) {
        await this.loadStaff(schoolSlug);
      } else {
        this.error = 'School name not found in the URL.';
        this.isLoading = false;
      }
    });
  }

  trackByStaffId(index: number, staff: Staff): string {
    return staff.id;
  }

  async loadStaff(schoolSlug: string) {
    this.isLoading = true;
    this.error = null;
    this.staffByRole = []; // Clear previous data
    this.filteredStaffByRole = [];

    try {
      // 1. Fetch School Details
      const schoolsCol = collection(this.firestore, 'schools');
      const schoolQuery = query(schoolsCol, where('slug', '==', schoolSlug), limit(1));
      const schoolSnapshot = await getDocs(schoolQuery);

      if (schoolSnapshot.empty) {
        throw new Error(`School with slug "${schoolSlug}" not found.`);
      }

      const schoolDoc = schoolSnapshot.docs[0];
      this.schoolData = { id: schoolDoc.id, slug: schoolSlug, ...schoolDoc.data() } as School;

      // 2. Fetch Staff from all relevant sub-collections concurrently
      const fetchPromises = this.staffCollections.map(colName =>
        getDocs(query(collection(this.firestore, `schools/${this.schoolData!.id}/${colName}`), where('status', '==', 'approved')))
      );

      const allStaff: Staff[] = [];
      const results = await Promise.allSettled(fetchPromises);

      results.forEach((snapshot, index) => {
        if (snapshot.status === 'fulfilled') {
          const role = this.staffCollections[index];
          snapshot.value.docs.forEach(docSnap => {
            const data = docSnap.data();
            const singularRole = (role.charAt(0).toUpperCase() + role.slice(1)).replace(/s$/, '');
            allStaff.push({
              id: docSnap.id,
              name: data['name'] || 'No Name',
              photoURL: data['photoURL'] || '',
              designation: data['designation'] || singularRole,
              email: data['email'] || '',
              role: singularRole,
              status: data['status'] || 'unknown',
              message: data['message'] || '',
              about_role: data[`about_${singularRole.toLowerCase()}`] || ''
            });
          });
        }
      });

      // Group staff by role
      const grouped = allStaff.reduce((acc, staff) => {
        (acc[staff.role] = acc[staff.role] || []).push(staff);
        return acc;
      }, {} as { [key: string]: Staff[] });

      this.staffByRole = Object.keys(grouped).map(role => ({
        role,
        members: grouped[role].sort((a, b) => a.name.localeCompare(b.name))
      })).sort((a, b) => a.role.localeCompare(b.role));

      // Populate role filters for the dropdown
      this.roleFilters = this.staffByRole.map(group => ({
        value: group.role,
        name: `${group.role}s`
      }));

      this.applyFilter();
    } catch (err: any) {
      console.error('Error fetching staff profiles:', err);
      this.error = err.message || 'An error occurred while fetching staff profiles.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges(); // Manually trigger change detection
    }
  }

  applyFilter() {
    if (this.selectedRole === 'all') {
      this.filteredStaffByRole = [...this.staffByRole];
    } else {
      this.filteredStaffByRole = this.staffByRole.filter(group => group.role === this.selectedRole);
    }
  }
}