import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExamcontrollerMenu } from '../../Navbar/examcontroller-menu/examcontroller-menu';

@Component({
  selector: 'app-examcontroller-dashboard',
  imports: [RouterOutlet, ExamcontrollerMenu],
  templateUrl: './examcontroller-dashboard.html',
  styleUrl: './examcontroller-dashboard.scss'
})
export class ExamcontrollerDashboard {

}
