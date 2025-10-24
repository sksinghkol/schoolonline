import { Component, effect, Injector, OnInit } from '@angular/core';
import { doc, Firestore, collection, getDocs, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { SchoolStateService } from '../../core/services/school-state.service';
import { forkJoin, from } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface User {
  id: string;
  role: string;
  status: 'waiting-approval' | 'approved';
  name: string;
  photoURL?: string; // It might be optional
  email?: string;
  [key: string]: any; // for other properties from doc.data()
}

@Component({
  selector: 'app-director-userlist',
  imports: [CommonModule, FormsModule],
  templateUrl: './director-userlist.html',
  styleUrl: './director-userlist.scss'
})
export class DirectorUserlist implements OnInit {
  loading = true;
  schoolId!: string;
  awaitingUsers: User[] = [];
  approvedUsers: User[] = []; 
  filteredAwaitingUsers: User[] = [];
  filteredApprovedUsers: User[] = [];
  selectedRole = 'all'; // filter
  roleCollections = [
    'accounts', 'directors', 'examcontrollers', 'frontdesks', 'itdepartments',
    'parrents', 'principals', 'reviews', 'securitys', 'staffs', 'students', 'teachers','transports'
  ];

  constructor(
    private firestore: Firestore, 
    public schoolState: SchoolStateService,
    private injector: Injector
  ) {}

  ngOnInit() {
    // Use an effect to react to changes in the current school signal.
    // This will re-run whenever the school changes.
    effect(() => {
      const currentSchool = this.schoolState.currentSchool();
      if (currentSchool && currentSchool.id) {
        // Check if the school has actually changed to prevent unnecessary reloads
        if (this.schoolId !== currentSchool.id) {
          this.schoolId = currentSchool.id;
          this.loadAllUsers();
        }
      }
    }, { injector: this.injector });
  }

  // 🔹 Load all users from all subcollections
  loadAllUsers() {
    this.loading = true;
    const requests = this.roleCollections.map(colName =>
      from(getDocs(collection(this.firestore, `schools/${this.schoolId}/${colName}`)))
    );

    forkJoin(requests).subscribe({
      next: results => {
        const allUsers: User[] = results.flatMap((snapshot, i) =>
          snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            role: this.roleCollections[i] // Use the collection name as the role
          } as User))
        );

        this.awaitingUsers = allUsers.filter(u => u.status === 'waiting-approval');
        this.approvedUsers = allUsers.filter(u => u.status === 'approved');
        this.applyFilter();
        this.loading = false;
      },
      error: err => {
        console.error('Error loading users:', err);
        this.loading = false;
      }
    });
  }

  // 🔹 Approve a user
  async approveUser(user: User) {
    try {
      const ref = doc(this.firestore, `schools/${this.schoolId}/${user.role}/${user.id}`);
      await updateDoc(ref, { status: 'approved' });      
      // Optimistically update the UI without a full reload
      const index = this.awaitingUsers.findIndex(u => u.id === user.id && u.role === user.role);
      if (index > -1) {
        const [approvedUser] = this.awaitingUsers.splice(index, 1);
        approvedUser.status = 'approved';
        this.approvedUsers.push(approvedUser);
        
        // Also remove from the filtered list for an immediate UI update
        const filteredIndex = this.filteredAwaitingUsers.findIndex(u => u.id === user.id && u.role === user.role);
        if (filteredIndex > -1) {
          this.filteredAwaitingUsers.splice(filteredIndex, 1);
        }
        this.applyFilter(); // Re-apply filter to add the user to the approved list display
      }
    } catch (err) {
      console.error('Error approving user:', err);
    }
  }

  // 🔹 Edit a user (placeholder)
  editUser(user: User) {
    // TODO: Implement navigation to an edit page or open a modal
    console.log('Editing user:', user);
    alert(`Editing ${user.name}. Implement the edit functionality here.`);
  }

  // 🔹 Delete a user
  async deleteUser(user: User) {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      const ref = doc(this.firestore, `schools/${this.schoolId}/${user.role}/${user.id}`);
      await deleteDoc(ref);
      // Optimistically update the UI
      let index = this.awaitingUsers.findIndex(u => u.id === user.id && u.role === user.role);
      if (index > -1) {
        this.awaitingUsers.splice(index, 1);
      } else {
        index = this.approvedUsers.findIndex(u => u.id === user.id && u.role === user.role);
        if (index > -1) this.approvedUsers.splice(index, 1);
      }
      this.applyFilter(); // Refresh the filtered lists
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  }

  // 🔹 Apply role filter to user lists
  applyFilter() {
    const filterFn = (u: User) => this.selectedRole === 'all' || u.role === this.selectedRole;
    this.filteredAwaitingUsers = this.awaitingUsers.filter(filterFn);
    this.filteredApprovedUsers = this.approvedUsers.filter(filterFn);
  }
}
