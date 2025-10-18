import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TeacherMenu } from '../../Navbar/teacher-menu/teacher-menu';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterOutlet,TeacherMenu],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.scss'
})
export class TeacherDashboard {

}
