import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ParrentMenu } from '../../Navbar/parrent-menu/parrent-menu';

@Component({
  selector: 'app-parrent-dashboard',
  imports: [RouterOutlet, ParrentMenu],
  templateUrl: './parrent-dashboard.html',
  styleUrl: './parrent-dashboard.scss'
})
export class ParrentDashboard {

}
