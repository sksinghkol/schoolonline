import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountMenu } from '../../Navbar/account-menu/account-menu';

@Component({
  selector: 'app-account-dashboard',
  imports: [RouterOutlet, AccountMenu],
  templateUrl: './account-dashboard.html',
  styleUrl: './account-dashboard.scss'
})
export class AccountDashboard {

}
