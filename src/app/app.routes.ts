import { Routes } from '@angular/router';
import { Home } from './Home/home/home';
import { AdminDashboard } from './Admin/admin-dashboard/admin-dashboard';
import { AdminLogin } from './Login/admin-login/admin-login';
import { StudentLogin } from './Login/student-login/student-login';
import { StudentDashboard } from './Student/student-dashboard/student-dashboard';
import { AdminHome } from './Admin/admin-home/admin-home';
import { AddSchool } from './Admin/add-school/add-school';
import { AddSubscription } from './Admin/add-subscription/add-subscription';
import { SchoolDetails } from './Admin/school-details/school-details';
import { LoginHistory } from './Admin/LoginHistory/login-history/login-history';
import { AddDirector } from './Admin/add-director/add-director';
import { IdCards } from './Admin/id-cards/id-cards';

// ✅ Use the correct AdminGuard import
import { AdminGuard } from './core/gaurds/admin.guard';
import { Holder } from './Admin/IdCards/holder/holder';
import { CardsComponent } from './Admin/IdCards/cards/cards';
import { ClipComponent } from './Admin/IdCards/clip/clip';
import { Hooks } from './Admin/IdCards/hooks/hooks';
import { LanyardsComponent } from './Admin/IdCards/lanyards/lanyards';
import { CardsDesign } from './Admin/IdCards/cards-design/cards-design';
import { VisitingCard } from './Admin/SchoolMaterial/visiting-cards/visiting-cards';
import { Prospectus } from './Admin/SchoolMaterial/prospectus/prospectus';
import { LibraryCard } from './Admin/SchoolMaterial/library-card/library-card';
import { GatePass } from './Admin/SchoolMaterial/gate-pass/gate-pass';
import { StudentOutpass } from './Admin/SchoolMaterial/student-outpass/student-outpass';
import { VistorsPass } from './Admin/SchoolMaterial/vistors-pass/vistors-pass';
import { Medals } from './Admin/SchoolMaterial/medals/medals';
import { KeyRing } from './Admin/Ads/key-ring/key-ring';
import { Leaflet } from './Admin/Ads/leaflet/leaflet';
import { Brochure } from './Admin/Ads/brochure/brochure';

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
    canActivate: [AdminGuard],
    children: [
      { path: '', component: AdminHome, pathMatch: 'full' },
      { path: 'schools', component: AddSchool },
      { path: 'schools/:id', component: SchoolDetails }, // School Details
      { path: 'subscriptions', component: AddSubscription },
      { path: 'holder', component: Holder },
      { path: 'cards', component: CardsComponent },
      { path: 'cardsdesign', component: CardsDesign },
      { path: 'lanyards', component: LanyardsComponent },
      { path: 'clip', component: ClipComponent },
      { path: 'hook', component: Hooks },

     
      { path: 'loginHistory', component: LoginHistory },
      { path: 'director/:schoolId', component: AddDirector }, // Add Director
      { path: 'idcards/:id', component: IdCards }, // next step
       { path: 'visitingCards', component: VisitingCard },
       { path: 'Prospectus', component: Prospectus },
        { path: 'LibraryCard', component: LibraryCard },
        { path: 'GatePass', component: GatePass },
        { path: 'StudentOutPass', component: StudentOutpass },
        { path: 'VistorsPass', component: VistorsPass },
        { path: 'Medals', component: Medals },
         { path: 'KeyRing', component: KeyRing },
          { path: 'Leaflet', component: Leaflet },
           { path: 'Brochure', component: Brochure },
    ],
  },

  // Student Dashboard
  {
    path: 'student-dashboard',
    component: StudentDashboard,
    // If needed, create a separate StudentGuard
    // canActivate: [StudentGuard],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
