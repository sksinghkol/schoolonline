import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TransportMenu } from '../../Navbar/transport-menu/transport-menu';

@Component({
  selector: 'app-transport-dashboard',
  imports: [RouterOutlet,TransportMenu],
  templateUrl: './transport-dashboard.html',
  styleUrl: './transport-dashboard.scss'
})
export class TransportDashboard {

}
