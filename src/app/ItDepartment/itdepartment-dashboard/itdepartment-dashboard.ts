import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ItdepartmentMenu } from '../../Navbar/itdepartment-menu/itdepartment-menu';
import { Master } from '../master/master';
import { ViewQuestionPapers } from '../view-question-papers/view-question-papers';

@Component({
  selector: 'app-itdepartment-dashboard',
  imports: [RouterOutlet, ItdepartmentMenu, Master, ViewQuestionPapers ],
  templateUrl: './itdepartment-dashboard.html',
  styleUrl: './itdepartment-dashboard.scss'
})
export class ItdepartmentDashboard {

}
