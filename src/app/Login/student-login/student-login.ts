import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/student.auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-login',
  imports: [CommonModule],
  templateUrl: './student-login.html',
  styleUrls: ['./student-login.scss']
})
export class StudentLogin {
  schoolCode = 'SEC123'; // pre-selected for your use case

  constructor(private authService: AuthService) {}

  login() {
    this.authService.loginWithGoogle(this.schoolCode);
  }
}
