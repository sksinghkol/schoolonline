import { Component } from '@angular/core';
import { StudentHomepage } from '../student-homepage/student-homepage';
import { RouterOutlet } from '@angular/router';
import { StudentNavbar } from '../../Navbar/student-navbar/student-navbar';

@Component({
  selector: 'app-student-dashboard',
  imports: [StudentHomepage, RouterOutlet, StudentNavbar],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss'
})
export class StudentDashboard {

}
