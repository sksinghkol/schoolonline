import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SecurityMenu } from '../../Navbar/security-menu/security-menu';

@Component({
  selector: 'app-security-dashboard',
  imports: [RouterOutlet, SecurityMenu],
  templateUrl: './security-dashboard.html',
  styleUrl: './security-dashboard.scss'
})
export class SecurityDashboard {

}
