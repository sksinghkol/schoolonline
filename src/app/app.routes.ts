import { Routes } from '@angular/router';
import { Home } from './Home/home/home';
import { AdminDashboard } from './Admin/admin-dashboard/admin-dashboard';
import { AdminLogin } from './Login/admin-login/admin-login';
import { AuthGuard } from './core/gaurds/auth.guard';
import { StudentLogin } from './Login/student-login/student-login';
import { StudentDashboard } from './Student/student-dashboard/student-dashboard';
import { AdminHome } from './Admin/admin-home/admin-home';
import { AddSchool } from './Admin/add-school/add-school';
import { AddSubscription } from './Admin/add-subscription/add-subscription';
import { SchoolDetails } from './Admin/school-details/school-details';
import { LoginHistory } from './Admin/login-history/login-history';
import { AddDirector } from './Admin/add-director/add-director';
import { IdCards } from './Admin/id-cards/id-cards';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },

  // Admin login
  { path: 'admin-login', component: AdminLogin },

  // Student login
  { path: 'student-login', component: StudentLogin },

  // Admin Dashboard with children
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: AdminHome, pathMatch: 'full' },
      { path: 'schools', component: AddSchool },
      { path: 'schools/:id', component: SchoolDetails },  // School Details
      { path: 'subscriptions', component: AddSubscription },
      { path: 'loginHistory', component: LoginHistory },
      { path: 'director/:schoolId', component: AddDirector }, // Add Director
        { path: 'idcards/:id', component: IdCards }, // next step
    ]
  },

  // Student Dashboard
  {
    path: 'student-dashboard',
    component: StudentDashboard,
    canActivate: [AuthGuard],
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
