import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DirectorMenu } from '../../Navbar/director-menu/director-menu';
import { DirectorHomepage } from '../director-homepage/director-homepage';

@Component({
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [RouterOutlet, DirectorMenu,DirectorHomepage],
  templateUrl: './director-dashboard.html',
  styleUrls: ['./director-dashboard.scss']
 
})
export class DirectorDashboard {
}