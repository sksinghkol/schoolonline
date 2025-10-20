import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StaffMenu } from '../../Navbar/staff-menu/staff-menu';

@Component({
  selector: 'app-staff-dashboard',
  imports: [RouterOutlet, StaffMenu],
  templateUrl: './staff-dashboard.html',
  styleUrl: './staff-dashboard.scss'
})
export class StaffDashboard {

}
