import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SchoolMenu } from '../../Navbar/school-menu/school-menu';

@Component({
  selector: 'app-school-dashboard',
  imports: [  RouterOutlet , SchoolMenu],
  templateUrl: './school-dashboard.html',
  styleUrls: ['./school-dashboard.scss']
})
export class SchoolDashboard {

}
