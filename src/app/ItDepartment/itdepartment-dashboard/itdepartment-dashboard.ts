import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ItdepartmentMenu } from '../../Navbar/itdepartment-menu/itdepartment-menu';

@Component({
  selector: 'app-itdepartment-dashboard',
  imports: [RouterOutlet, ItdepartmentMenu],
  templateUrl: './itdepartment-dashboard.html',
  styleUrl: './itdepartment-dashboard.scss'
})
export class ItdepartmentDashboard {

}
