import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminMenu } from '../../Navbar/admin-menu/admin-menu';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterOutlet,AdminMenu],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboard {

}
