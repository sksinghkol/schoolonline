import { Routes } from '@angular/router';

/* Components */
import { Home } from './Home/home/home';
import { AllLogin } from './Home/home/all-login';
import { AdminLogin } from './Login/admin-login/admin-login';
import { StudentLogin } from './Login/student-login/student-login';
import { SuperLogin } from './Login/super-login/super-login';
import { StudentDashboard } from './Student/student-dashboard/student-dashboard';
import { AdminDashboard } from './Admin/admin-dashboard/admin-dashboard';
import { AdminHome } from './Admin/admin-home/admin-home';
import { AddSchool } from './Admin/add-school/add-school';
import { AddSubscription } from './Admin/add-subscription/add-subscription';
import { SchoolDetails } from './Admin/school-details/school-details';
import { AddDirector } from './Admin/add-director/add-director';
import { LoginHistory } from './Admin/LoginHistory/login-history/login-history';
import { IdCards } from './Admin/id-cards/id-cards';
import { Holder } from './Admin/IdCards/holder/holder';
import { CardsComponent } from './Admin/IdCards/cards/cards';
import { CardsDesign } from './Admin/IdCards/cards-design/cards-design';
import { ClipComponent } from './Admin/IdCards/clip/clip';
import { Hooks } from './Admin/IdCards/hooks/hooks';
import { LanyardsComponent } from './Admin/IdCards/lanyards/lanyards';
import { LanyardsDesign } from './Admin/IdCards/lanyards-design/lanyards-design';
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
import { AdminGuard } from './core/gaurds/admin.guard';
import { AllAdminLogin } from './SuperAdmin/all-admin-login/all-admin-login';
import { SchoolDashboard } from './School/school-dashboard/school-dashboard';
import { SchoolHome } from './School/school-home/school-home';

export const routes: Routes = [
  /* Home & General Login */
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'all-login', component: AllLogin },
  { path: 'admin-login', component: AdminLogin },
  { path: 'student-login', component: StudentLogin },
  { path: 'student-login/:schoolName', component: StudentLogin },
  { path: 'super-admin-login', component: SuperLogin },

  /* Admin Dashboard */
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: AdminHome, pathMatch: 'full' },
      { path: 'schools', component: AddSchool },
      { path: 'schools/:id', component: SchoolDetails },
      { path: 'subscriptions', component: AddSubscription },
      { path: 'director/:schoolId', component: AddDirector },
      { path: 'idcards/:id', component: IdCards },
      { path: 'holder', component: Holder },
      { path: 'cards', component: CardsComponent },
      { path: 'cardsdesign', component: CardsDesign },
      { path: 'lanyards', component: LanyardsComponent },
      { path: 'lanyardsdesign', component: LanyardsDesign },
      { path: 'clip', component: ClipComponent },
      { path: 'hook', component: Hooks },
      { path: 'visitingCards', component: VisitingCard },
      { path: 'prospectus', component: Prospectus },
      { path: 'libraryCard', component: LibraryCard },
      { path: 'gatePass', component: GatePass },
      { path: 'studentOutPass', component: StudentOutpass },
      { path: 'vistorsPass', component: VistorsPass },
      { path: 'medals', component: Medals },
      { path: 'keyRing', component: KeyRing },
      { path: 'leaflet', component: Leaflet },
      { path: 'brochure', component: Brochure },
      { path: 'loginHistory', component: LoginHistory },
      { path: 'allLoginAdmin', component: AllAdminLogin }
    ]
  },

  /* Student Dashboard */
  { path: 'student-dashboard', component: StudentDashboard },

  /* Dynamic School URL */
  {
    path: 'SchoolDashboard/:schoolName',
    component: SchoolDashboard,
    children: [
      { path: '', component: SchoolHome, pathMatch: 'full' },
      { path: 'SchoolDetails', component: SchoolDetails }
    ]
  },

  /* Fallback */
  { path: '**', redirectTo: '' }
];
