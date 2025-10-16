import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="padding:2rem;">
      <h2>Complete your profile</h2>
      <p>We couldn't find a completed student record. Please complete your profile to proceed.</p>
      <pre>studentId: {{ studentId }} | schoolId: {{ schoolId }}</pre>
    </div>
  `,
})
export class UpdateProfile {
  studentId: string | null = null;
  schoolId: string | null = null;

  constructor(private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe(params => {
      this.studentId = params.get('studentId');
      this.schoolId = params.get('schoolId');
    });
  }
}
