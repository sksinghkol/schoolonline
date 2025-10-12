import { Routes } from '@angular/router';

/* ----------------------------- 🏠 Home Components ----------------------------- */
import { Home } from './Home/home/home';
import { AllLogin } from './Home/home/all-login';

/* ----------------------------- 🔐 Login Components ----------------------------- */
import { AdminLogin } from './Login/admin-login/admin-login';
import { StudentLogin } from './Login/student-login/student-login';
import { SuperLogin } from './Login/super-login/super-login';

/* ----------------------------- 🧑‍🎓 Student Components ----------------------------- */
import { StudentDashboard } from './Student/student-dashboard/student-dashboard';

/* ----------------------------- 🧑‍💼 Admin Core Components ----------------------------- */
import { AdminDashboard } from './Admin/admin-dashboard/admin-dashboard';
import { AdminHome } from './Admin/admin-home/admin-home';
import { AddSchool } from './Admin/add-school/add-school';
import { AddSubscription } from './Admin/add-subscription/add-subscription';
import { SchoolDetails } from './Admin/school-details/school-details';
import { AddDirector } from './Admin/add-director/add-director';
import { LoginHistory } from './Admin/LoginHistory/login-history/login-history';

/* ----------------------------- 🪪 ID Cards Section ----------------------------- */
import { IdCards } from './Admin/id-cards/id-cards';
import { Holder } from './Admin/IdCards/holder/holder';
import { CardsComponent } from './Admin/IdCards/cards/cards';
import { CardsDesign } from './Admin/IdCards/cards-design/cards-design';
import { ClipComponent } from './Admin/IdCards/clip/clip';
import { Hooks } from './Admin/IdCards/hooks/hooks';
import { LanyardsComponent } from './Admin/IdCards/lanyards/lanyards';
import { LanyardsDesign } from './Admin/IdCards/lanyards-design/lanyards-design';

/* ----------------------------- 🏫 School Materials ----------------------------- */
import { VisitingCard } from './Admin/SchoolMaterial/visiting-cards/visiting-cards';
import { Prospectus } from './Admin/SchoolMaterial/prospectus/prospectus';
import { LibraryCard } from './Admin/SchoolMaterial/library-card/library-card';
import { GatePass } from './Admin/SchoolMaterial/gate-pass/gate-pass';
import { StudentOutpass } from './Admin/SchoolMaterial/student-outpass/student-outpass';
import { VistorsPass } from './Admin/SchoolMaterial/vistors-pass/vistors-pass';
import { Medals } from './Admin/SchoolMaterial/medals/medals';

/* ----------------------------- 📢 Advertisement Section ----------------------------- */
import { KeyRing } from './Admin/Ads/key-ring/key-ring';
import { Leaflet } from './Admin/Ads/leaflet/leaflet';
import { Brochure } from './Admin/Ads/brochure/brochure';

/* ----------------------------- 🛡️ Guards ----------------------------- */
import { AdminGuard } from './core/gaurds/admin.guard';
import { AllAdminLogin } from './SuperAdmin/all-admin-login/all-admin-login';

/* =============================================================================== */
/*                                   🚏 ROUTES                                    */
/* =============================================================================== */

export const routes: Routes = [
  /* ----------------------------- Public Routes ----------------------------- */
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'all-login', component: AllLogin },
  { path: 'admin-login', component: AdminLogin },
  { path: 'student-login', component: StudentLogin },
  { path: 'super-admin-login', component: SuperLogin },

  /* ----------------------------- Admin Dashboard ----------------------------- */
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: AdminHome, pathMatch: 'full' },

      // 🏫 School Management
      { path: 'schools', component: AddSchool },
      { path: 'schools/:id', component: SchoolDetails },
      { path: 'subscriptions', component: AddSubscription },
      { path: 'director/:schoolId', component: AddDirector },

      // 🪪 ID Cards & Accessories
      { path: 'idcards/:id', component: IdCards },
      { path: 'holder', component: Holder },
      { path: 'cards', component: CardsComponent },
      { path: 'cardsdesign', component: CardsDesign },
      { path: 'lanyards', component: LanyardsComponent },
      { path: 'lanyardsdesign', component: LanyardsDesign },
      { path: 'clip', component: ClipComponent },
      { path: 'hook', component: Hooks },

      // 🏫 School Materials
      { path: 'visitingCards', component: VisitingCard },
      { path: 'Prospectus', component: Prospectus },
      { path: 'LibraryCard', component: LibraryCard },
      { path: 'GatePass', component: GatePass },
      { path: 'StudentOutPass', component: StudentOutpass },
      { path: 'VistorsPass', component: VistorsPass },
      { path: 'Medals', component: Medals },

      // 📢 Advertisements
      { path: 'KeyRing', component: KeyRing },
      { path: 'Leaflet', component: Leaflet },
      { path: 'Brochure', component: Brochure },

      // 🧾 Logs
      { path: 'loginHistory', component: LoginHistory },
       { path: 'AllLoginadmin', component: AllAdminLogin },
    ],
  },

  /* ----------------------------- Student Dashboard ----------------------------- */
  {
    path: 'student-dashboard',
    component: StudentDashboard,
    // canActivate: [StudentGuard], // optional future use
  },

  /* ----------------------------- Fallback ----------------------------- */
  { path: '**', redirectTo: '' },
];
