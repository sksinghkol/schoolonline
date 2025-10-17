import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StudentNavbar } from '../../Navbar/student-navbar/student-navbar';
import { DirectorMenu } from '../../Navbar/director-menu/director-menu';

@Component({
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [RouterOutlet, DirectorMenu],
  templateUrl: './director-dashboard.html',
  styleUrls: ['./director-dashboard.scss']
 
})
export class DirectorDashboard {
}