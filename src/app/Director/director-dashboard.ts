import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DirectorNavbar } from './director-navbar';
import { DirectorHomepage } from './director-homepage';

@Component({

  selector: 'app-director-dashboard',
  standalone: true,
  imports: [RouterOutlet, DirectorNavbar, DirectorHomepage],
  templateUrl: './director-dashboard.html',
  styleUrl: './director-dashboard.scss'
})
export class DirectorDashboard {
}