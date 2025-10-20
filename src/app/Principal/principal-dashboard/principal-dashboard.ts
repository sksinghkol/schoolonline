import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrincipalMenu } from '../../Navbar/principal-menu/principal-menu';

@Component({
  selector: 'app-principal-dashboard',
  imports: [RouterOutlet, PrincipalMenu],
  templateUrl: './principal-dashboard.html',
  styleUrl: './principal-dashboard.scss'
})
export class PrincipalDashboard {

}
