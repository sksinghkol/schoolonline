import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { collectionGroup, deleteDoc, doc, Firestore, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';

interface User {
  id: string;
  role: string;
  status: 'waiting-approval' | 'approved';
  name: string;
  photoURL?: string;
  schoolId?: string;
  schoolName?: string;
  email?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-admin-alluser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-alluser.html',
  styleUrls: ['./admin-alluser.scss']
})
export class AdminAlluser implements OnInit {
  loading = true;
  userRoles = [
    'principals', 
    'teachers', 
    'students', 
    'accounts', 
    'itdepartments', 
    'staffs', 
    'directors',
    'frontdesks',
    'securitys',
    'transports',
    'examcontrollers',
    'parents'
  ];
  usersByRole: { [role: string]: { awaiting: User[], approved: User[] } } = {};
  selectedRole: string = this.userRoles[0];
  editingUser: User | null = null;

  constructor(private firestore: Firestore) {
    this.userRoles.forEach(role => {
      this.usersByRole[role] = { awaiting: [], approved: [] };
    });
  }

  ngOnInit() {
    this.loadAllUsersFromAllSchools();
  }

  async loadAllUsersFromAllSchools() {
    this.loading = true;
    console.log('Loading all users from all schools...');

    try {
      const allRolePromises = this.userRoles.map(async (role) => {
        const usersCollectionGroup = collectionGroup(this.firestore, role);
        const snapshot = await getDocs(usersCollectionGroup);
        
        const userPromises = snapshot.docs.map(async (docSnap) => {
          const schoolDocRef = docSnap.ref.parent.parent;
          if (!schoolDocRef) return null;

          const schoolDoc = await getDoc(schoolDocRef);
          const schoolData = schoolDoc.exists() ? schoolDoc.data() : { name: 'Unknown School' };

          return {
            id: docSnap.id,
            ...docSnap.data(),
            role: role,
            schoolId: schoolDocRef.id,
            schoolName: schoolData['name']
          } as User;
        });

        const users = (await Promise.all(userPromises)).filter(user => user !== null) as User[];
        
        this.usersByRole[role] = {
          awaiting: users.filter(u => u.status === 'waiting-approval'),
          approved: users.filter(u => u.status === 'approved'),
        };
      });

      await Promise.all(allRolePromises);
      console.log('All users loaded and processed.');

    } catch (err) {
      console.error('Error loading users from Firestore:', err);
    } finally {
      this.loading = false;
    }
  }

  selectRole(role: string) {
    this.selectedRole = role;
  }

  // 🔹 Approve a user
  async approveUser(user: User) {
    if (!user.schoolId) {
      console.error('Cannot approve user without a schoolId', user);
      return;
    }
    try {
      const ref = doc(this.firestore, `schools/${user.schoolId}/${user.role}/${user.id}`);
      await updateDoc(ref, { status: 'approved' });

      // Optimistically update the UI
      const roleData = this.usersByRole[user.role];
      const index = roleData.awaiting.findIndex(u => u.id === user.id);
      if (index > -1) {
        const [approvedUser] = roleData.awaiting.splice(index, 1);
        approvedUser.status = 'approved';
        roleData.approved.push(approvedUser);
      }
    } catch (err) {
      console.error('Error approving user:', err);
    }
  }

  // 🔹 Select a user to edit and clone their data for the form
  selectUserForEdit(user: User) {
    this.editingUser = { ...user };
  }

  // 🔹 Update the user in Firestore
  async updateUser() {
    if (!this.editingUser || !this.editingUser.schoolId || !this.editingUser.id) {
      console.error('Cannot update user: missing data', this.editingUser);
      return;
    }

    try {
      const { id, schoolId, role, name, email } = this.editingUser;
      const ref = doc(this.firestore, `schools/${schoolId}/${role}/${id}`);
      await updateDoc(ref, { name, email });

      // Update the local array to reflect the change in the UI
      const roleData = this.usersByRole[role];
      const index = roleData.approved.findIndex(u => u.id === id);
      if (index > -1) {
        roleData.approved[index] = { ...this.editingUser };
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  }

  // 🔹 Delete a user
  async deleteUser(user: User) {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    if (!user.schoolId) {
      console.error('Cannot delete user without a schoolId', user);
      return;
    }
    try {
      const ref = doc(this.firestore, `schools/${user.schoolId}/${user.role}/${user.id}`);
      await deleteDoc(ref);

      // Optimistically update the UI
      const roleData = this.usersByRole[user.role];
      if (user.status === 'approved') {
        const index = roleData.approved.findIndex(u => u.id === user.id);
        if (index > -1) roleData.approved.splice(index, 1);
      } else { // 'waiting-approval'
        const index = roleData.awaiting.findIndex(u => u.id === user.id);
        if (index > -1) roleData.awaiting.splice(index, 1);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  }
}