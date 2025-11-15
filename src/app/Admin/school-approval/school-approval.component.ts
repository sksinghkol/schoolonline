import { Component, OnInit, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface School {
  id: string;
  name: string;
  status: 'waiting-for-approval' | 'approved';
  logoUrl?: string;
  city?: string;
  createdAt: any;
}

@Component({
  selector: 'app-school-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './school-approval.component.html',
  styleUrls: ['./school-approval.component.scss']
})
export class SchoolApprovalComponent implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private router: Router = inject(Router);

  loading = true;
  awaitingSchools: School[] = [];
  approvedSchools: School[] = [];

  ngOnInit() {
    this.loadSchools();
  }

  async loadSchools() {
    this.loading = true;
    try {
      const schoolsCollection = collection(this.firestore, 'schools');
      const q = query(schoolsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const allSchools = querySnapshot.docs.map(doc => {
        const schoolData = { id: doc.id, ...doc.data() } as School;
        console.log('Raw school data:', schoolData); // Log each school's data
        return schoolData;
      });

      this.awaitingSchools = allSchools.filter(s => s.status === 'waiting-for-approval');
      this.approvedSchools = allSchools.filter(s => s.status === 'approved');
      console.log('Filtered Awaiting Schools:', this.awaitingSchools);
      console.log('Filtered Approved Schools:', this.approvedSchools);
    } catch (error) {
      console.error("Error loading schools:", error);
    } finally {
      this.loading = false;
    }
  }

  async approveSchool(school: School) {
    try {
      const schoolDocRef = doc(this.firestore, `schools/${school.id}`);
      await updateDoc(schoolDocRef, { status: 'approved' });
      await this.loadSchools(); // Refresh the lists
    } catch (error) {
      console.error("Error approving school:", error);
    }
  }

  async deleteSchool(schoolId: string) {
    if (confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(this.firestore, `schools/${schoolId}`));
        await this.loadSchools(); // Refresh the lists
      } catch (error) {
        console.error("Error deleting school:", error);
      }
    }
  }
}