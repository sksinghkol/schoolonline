import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FrontdeskMenu } from '../../Navbar/frontdesk-menu/frontdesk-menu';

@Component({
  selector: 'app-frontdesk-dashboard',
  imports: [RouterOutlet, FrontdeskMenu],
  templateUrl: './frontdesk-dashboard.html',
  styleUrl: './frontdesk-dashboard.scss'
})
export class FrontdeskDashboard {

}
