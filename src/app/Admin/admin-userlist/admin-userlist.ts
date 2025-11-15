import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';

interface User {
  id: string;
  role: string;
  status: 'waiting-approval' | 'approved';
  name: string;
  photoURL?: string;
  email?: string;
  phone?: string;
  schoolId?: string;
  schoolName?: string;
  [key: string]: any;
}

interface School {
  id: string;
  name: string;
}

@Component({
  selector: 'app-admin-userlist',
  templateUrl: './admin-userlist.html',
  styleUrls: ['./admin-userlist.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminUserList implements OnInit {
  loading = true;
  schools: School[] = [];
  subCollections = [
    'directors',
    'teachers',
    'staffs',
    'principals',
    'accounts',
    'itdepartments',
    'frontdesks',
    'securitys',
    'transports',
    'examcontrollers',
    'parents',
    'students'
  ];
  
  usersBySchool: { [schoolId: string]: { [role: string]: User[] } } = {};
  awaitingUsers: User[] = [];
  approvedUsers: User[] = [];

  // Add these properties
  searchTerm = '';
  selectedSchool = 'all';
  selectedRole = 'all';
  filteredAwaitingUsers: User[] = [];
  filteredApprovedUsers: User[] = [];

  editingUser: User | null = null;
  @ViewChild('editForm') editForm!: NgForm;

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.loadSchoolsAndUsers();
  }

  private async loadSchoolsAndUsers() {
    // First load all schools
    this.firestore.collection('schools').snapshotChanges().subscribe(schools => {
      this.schools = schools.map(school => ({
        id: school.payload.doc.id,
        ...school.payload.doc.data() as any
      }));

      // Then load users from each subcollection for each school
      this.schools.forEach(school => {
        this.subCollections.forEach(collection => {
          this.firestore
            .collection(`schools/${school.id}/${collection}`)
            .snapshotChanges()
            .subscribe(users => {
              if (!this.usersBySchool[school.id]) {
                this.usersBySchool[school.id] = {};
              }
              
              this.usersBySchool[school.id][collection] = users.map(user => ({
                id: user.payload.doc.id,
                role: collection,
                schoolId: school.id,
                schoolName: school.name,
                ...user.payload.doc.data() as any
              }));

              this.updateUserLists();
            });
        });
      });
    });
  }

  private updateUserLists() {
    this.awaitingUsers = [];
    this.approvedUsers = [];

    Object.values(this.usersBySchool).forEach(schoolUsers => {
      Object.values(schoolUsers).forEach(users => {
        users.forEach(user => {
          if (user['status'] === 'waiting-approval') {
            this.awaitingUsers.push(user);
          } else {
            this.approvedUsers.push(user);
          }
        });
      });
    });

    this.applyFilters();
    this.loading = false;
  }

  // Add this method
  applyFilters() {
    const searchLower = this.searchTerm.toLowerCase();
    
    // Filter all users
    const filterUser = (user: User) => {
      const matchesSearch = !this.searchTerm || 
        user['name']?.toLowerCase().includes(searchLower) ||
        user['email']?.toLowerCase().includes(searchLower);
        
      const matchesSchool = this.selectedSchool === 'all' || 
        user['schoolId'] === this.selectedSchool;
        
      const matchesRole = this.selectedRole === 'all' || 
        user['role'] === this.selectedRole;

      return matchesSearch && matchesSchool && matchesRole;
    };

    // Apply filters to both lists
    this.filteredAwaitingUsers = this.awaitingUsers.filter(filterUser);
    this.filteredApprovedUsers = this.approvedUsers.filter(filterUser);
  }

  approveUser(user: User) {
    const userRef = this.firestore.doc(
      `schools/${user['schoolId']}/${user['role']}/${user['id']}`
    );
    userRef.update({ status: 'approved' });
  }

  editUser(user: User) {
    // Create a copy of the user object to avoid direct reference
    this.editingUser = { ...user };
  }

  updateUser() {
    if (!this.editingUser || !this.editForm.valid) return;

    const userRef = this.firestore.doc(
      `schools/${this.editingUser['schoolId']}/${this.editingUser['role']}/${this.editingUser['id']}`
    );

    userRef.update({
      name: this.editingUser['name'],
      email: this.editingUser['email']
      // Add other fields as needed
    }).then(() => {
      // Close modal after successful update
      this.editingUser = null;
    }).catch(error => {
      console.error('Error updating user:', error);
    });
  }

  cancelEdit() {
    this.editingUser = null;
  }

  deleteUser(user: User) {
    const userRef = this.firestore.doc(
      `schools/${user['schoolId']}/${user['role']}/${user['id']}`
    );
    userRef.delete();
  }
}
