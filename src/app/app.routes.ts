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
import { StudentHistory } from './Admin/LoginHistory/student-history/student-history';
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
import { StudentAuthGuard } from './core/gaurds/student.auth.guard';
import { AwaitingApproval } from './Student/awaiting-approval/awaiting-approval';
import { UpdateProfile } from './Student/update-profile/update-profile';
import { DirectorLogin } from './Login/director-login/director-login';
import { DirectorDashboard } from './Director/director-dashboard/director-dashboard';
import { DirectorAuthGuard } from './core/gaurds/director.auth.guard';
import { Directorawaiting } from './Director/directorawaiting/directorawaiting';
import { TeacherDashboard } from './Teacher/teacher-dashboard/teacher-dashboard';
import { TeacherAuthGuard } from './core/gaurds/teacher.auth.guard';
import { TeacherLogin } from './Login/teacher-login/teacher-login';
import { TeacherAwating } from './Teacher/teacher-awating/teacher-awating';
import { AccountLogin } from './Login/account-login/account-login';
import { AccountAwaiting } from './Account/account-awaiting/account-awaiting'; // Assuming this component exists or will be created
import { AccountDashboard } from './Account/account-dashboard/account-dashboard';
import { AccountAuthGuard } from './core/gaurds/account.auth.guard';
import { PrincipalLogin } from './Login/principal-login/principal-login';
import { PrincipalDashboard } from './Principal/principal-dashboard/principal-dashboard';
import { PrincipalAuthGuard } from './core/gaurds/principal.auth.guard';
import { PrincipalAwating } from './Principal/principal-awating/principal-awating';
import { StaffLogin } from './Login/staff-login/staff-login';
import { StaffAuthGuard } from './core/gaurds/staff.auth.guard';
import { StaffDashboard } from './Staff/staff-dashboard/staff-dashboard';
import { StaffAwaiting } from './Staff/staff-awaiting/staff-awaiting';
import { TransportLogin } from './Login/transport-login/transport-login';
import { TransportDashboard } from './Transport/transport-dashboard/transport-dashboard';
import { TransportAuthGuard } from './core/gaurds/transport.auth.guard';
import { TransportAwaiting } from './Transport/transport-awaiting/transport-awaiting';
import { FrontdeskLogin } from './Login/frontdesk-login/frontdesk-login';
import { FrontdeskDashboard } from './Frontdesk/frontdesk-dashboard/frontdesk-dashboard';
import { FrontdeskAuthGuard } from './core/gaurds/frontdesk.auth.guard';
import { FrontdeskAwaiting } from './Frontdesk/frontdesk-awaiting/frontdesk-awaiting';
import { SecurityLogin } from './Login/security-login/security-login';
import { SecurityDashboard } from './Security/security-dashboard/security-dashboard';
import { SecurityAuthGuard } from './core/gaurds/security.auth.guard';
import { SecurityAwaiting } from './Security/security-awaiting/security-awaiting';
import { ExamcontrollerLogin } from './Login/examcontroller-login/examcontroller-login';
import { ExamcontrollerAwaiting } from './ExamCordinator/examcontroller-awaiting/examcontroller-awaiting';
import { ExamcontrollerDashboard } from './ExamCordinator/examcontroller-dashboard/examcontroller-dashboard';
import { ExamcontrollerAuthGuard } from './core/gaurds/examcontroller.auth.guard';
import { ItdepartmentLogin } from './Login/itdepartment-login/itdepartment-login';
import { ItdepartmentAwaiting } from './ItDepartment/itdepartment-awaiting/itdepartment-awaiting';
import { ItdepartmentDashboard } from './ItDepartment/itdepartment-dashboard/itdepartment-dashboard';
import { ParrentLogin } from './Login/parrent-login/parrent-login';
import { ParrentAwaiting } from './Parrent/parrent-awaiting/parrent-awaiting';
import { ParrentDashboard } from './Parrent/parrent-dashboard/parrent-dashboard';
import { ParrentAuthGuard } from './core/gaurds/parrent.auth.guard';
import { DirectorProfile } from './Director/director-profile/director-profile';
import { DirectorUserlist } from './Director/director-userlist/director-userlist';
import { ManagementDesk } from './School/managemant-desk/managemant-desk';
import { Directorexpense } from './Director/directorexpense/directorexpense';
import { PrincipalProfile } from './Principal/principal-profile/principal-profile';
import { StaffList } from './School/staff-list/staff-list';
import { TeacherProfile } from './Teacher/teacher-profile/teacher-profile';
import { TeacherQuestionbank } from './Teacher/teacher-questionbank/teacher-questionbank';
import { TeacherYoutubeComponent } from './Teacher/teacher-youtube/teacher-youtube.component';
import { TexamQuestion } from './Teacher/texam-question/texam-question';
import { StudentQuestionBankComponent } from './School/student-question-bank/student-question-bank';
import { StudentsVideo } from './School/students-video/students-video';
import { ViewQuestionPapers } from './ItDepartment/view-question-papers/view-question-papers';
import { QuestionListComponent } from './ItDepartment/master/question-list/question-list';
import { Master } from './ItDepartment/master/master';
import { ItLeave } from './ItDepartment/it-leave/it-leave';
import { SchoolAboutus } from './School/school-aboutus/school-aboutus';
import { OurCourses } from './School/our-courses/our-courses';
import { OurCurriculum } from './School/our-crriculam/our-crriculam';
import { Mission } from './School/mission/mission';
import { OurSyllabus } from './School/our-syllabus/our-syllabus';
import { OurFacility } from './School/our-facility/our-facility';
import { OurVision } from './School/our-vision/our-vision';
import { FacultyComponent } from './School/faculty/faculty';
import { SchoolApprovalComponent } from './Admin/school-approval/school-approval.component';
import { AdminUserList } from './Admin/admin-userlist/admin-userlist';
import { AdminAlluser } from './Admin/admin-alluser/admin-alluser';
export const routes: Routes = [
  /* Home & General Login */
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'all-login', component: AllLogin },
  { path: 'admin-login', component: AdminLogin },
  { path: 'student-login', component: StudentLogin },
  { path: 'student-login/:schoolName', component: StudentLogin },
  { path: 'super-admin-login', component: SuperLogin },
  { path: 'director-login', component: DirectorLogin },
  { path: 'director-login/:schoolName', component: DirectorLogin },
  { path: 'teacher-login', component: TeacherLogin },
  { path: 'teacher-login/:schoolName', component: TeacherLogin },
  { path: 'account-login', component: AccountLogin },
  { path: 'account-login/:schoolName', component: AccountLogin },
  { path: 'principal-login', component: PrincipalLogin },
  { path: 'principal-login/:schoolName', component: PrincipalLogin },
  { path: 'staff-login', component: StaffLogin },
  { path: 'staff-login/:schoolName', component: StaffLogin },
  { path: 'transport-login', component: TransportLogin },
  { path: 'transport-login/:schoolName', component: TransportLogin },
  { path: 'frontdesk-login', component: FrontdeskLogin },
  { path: 'frontdesk-login/:schoolName', component: FrontdeskLogin },
  { path: 'security-login', component: SecurityLogin },
  { path: 'security-login/:schoolName', component: SecurityLogin },
  { path: 'examcontroller-login', component: ExamcontrollerLogin },
  { path: 'examcontroller-login/:schoolName', component: ExamcontrollerLogin },
  { path: 'itdepartment-login', component: ItdepartmentLogin },
  { path: 'itdepartment-login/:schoolName', component: ItdepartmentLogin },
  { path: 'parrent-login', component: ParrentLogin },
  { path: 'parrent-login/:schoolName', component: ParrentLogin },
  /* Admin Dashboard */
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: AdminHome, pathMatch: 'full' },
      { path: 'schools', component: AddSchool },
      { path: 'school-approval', component: SchoolApprovalComponent },
      { path: 'schools/:id', component: SchoolDetails },
      { path: 'subscriptions', component: AddSubscription },
      { path: 'DirectorList', component: AdminUserList },
      { path: 'UserList', component: AdminAlluser },
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
      { path: 'loginHistory/students', component: StudentHistory },
      { path: 'allLoginAdmin', component: AllAdminLogin },
    ],
  },
  /* Director Dashboard */
 {
  path: 'director-dashboard',
  component: DirectorDashboard,
  canActivate: [DirectorAuthGuard],
  children: [
    { path: 'director-profile', component: DirectorProfile },
    { path: 'director-userlist', component: DirectorUserlist },
    { path: 'director-expenses', component: Directorexpense },
  ]
}
,
  /* Account Dashboard */
  {
    path: 'account-dashboard',
    component: AccountDashboard,
    canActivate: [AccountAuthGuard],
  },
  /* Principal Dashboard */
  {
    path: 'principal-dashboard',
    component: PrincipalDashboard,
    canActivate: [PrincipalAuthGuard],
    children: [
    { path: 'principal-profile', component: PrincipalProfile },
   
    ]
  },
  /* staff Dashboard */
  {
    path: 'staff-dashboard',
    component: StaffDashboard,
    canActivate: [StaffAuthGuard],
  },
  {
    path: 'frontdesk-dashboard',
    component: FrontdeskDashboard,
    canActivate: [FrontdeskAuthGuard],
  },
  /* Transport Dashboard */
   {
    path: 'security-dashboard',
    component: SecurityDashboard,
    canActivate: [SecurityAuthGuard],
  },
  {
    path: 'transport-dashboard',
    component: TransportDashboard,
    canActivate: [TransportAuthGuard],
  },
  /* Teacher Dashboard */
  {
    path: 'teacher-dashboard',
    component: TeacherDashboard,
    canActivate: [TeacherAuthGuard],
    children: [
      { path: 'teacher-profile', component: TeacherProfile },
      { path: 'teacher-questionbank', component: TeacherQuestionbank },
      { path: 'teacher-youtube-videos', component: TeacherYoutubeComponent },
      { path: 'create-exam', component: TexamQuestion }
    ]
  },
  /* Exam Controller Dashboard */
  {
    path: 'examcontroller-dashboard',
    component: ExamcontrollerDashboard,
    canActivate: [ExamcontrollerAuthGuard],
  },
  /* IT Department Dashboard */
  {
    path: 'itdepartment-dashboard',
    component: ItdepartmentDashboard,
    canActivate: [ExamcontrollerAuthGuard], // TODO: Create and use an ItdepartmentAuthGuard
    children: [
      { path: 'question-papers', component: ViewQuestionPapers },
      { path: 'question-list', component: QuestionListComponent },
      { path: 'Master', component: Master },
      { path: 'ItLeave', component: ItLeave },
    ]
  },
  /* Attendance route removed */
  /* Parent Dashboard */
  {
    path: 'parrent-dashboard',
    component: ParrentDashboard,
    canActivate: [ParrentAuthGuard],
  },
  /* Student Dashboard */
  {
    path: 'student-dashboard',
    component: StudentDashboard,
    canActivate: [StudentAuthGuard],
  },

  /* Student flows */
  { path: 'awaiting-approval', component: AwaitingApproval },
  { path: 'director-awaiting-approval', component: Directorawaiting },
  { path: 'account-awaiting-approval', component: AccountAwaiting }, // Add this route
  { path: 'teacher-awaiting-approval', component: TeacherAwating },
   { path: 'transport-awaiting', component: TransportAwaiting },
     { path: 'frontdesk-awaiting', component: FrontdeskAwaiting },
  { path: 'principal-awating', component: PrincipalAwating },
  { path: 'staff-awaiting', component: StaffAwaiting },
  { path: 'update-profile', component: UpdateProfile },
  { path: 'examcontroller-awaiting', component: ExamcontrollerAwaiting },
  { path: 'itdepartment-awaiting', component: ItdepartmentAwaiting },
  { path: 'security-awaiting', component: SecurityAwaiting },
  { path: 'parrent-awaiting', component: ParrentAwaiting },

  /* Dynamic School URL */
  {
    path: 'SchoolDashboard/:schoolName',
    component: SchoolDashboard,
    children: [
      { path: '', component: SchoolHome, pathMatch: 'full' },
      { path: 'SchoolDetails', component: SchoolDetails },
      { path: 'ManagemantDesk', component: ManagementDesk },
      { path: 'StaffList', component: StaffList },
      { path: 'question-bank', component: StudentQuestionBankComponent },
      { path: 'teacher-videos', component: StudentsVideo },
      { path: 'AboutUs', component: SchoolAboutus },
       { path: 'Courses', component: OurCourses },
       { path: 'Curriculum', component: OurCurriculum },
       { path: 'Facilities', component: OurFacility },
       { path: 'Mission', component: Mission },
       { path: 'Vision', component: OurVision },
       { path: 'Syllabus', component: OurSyllabus },
       { path: 'Faculty', component: FacultyComponent },
    ],
  },

  /* Fallback */
  { path: '**', redirectTo: '' },
];
