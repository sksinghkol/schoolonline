import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SchoolStateService } from '../../core/services/school-state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-school-menu',
  imports: [RouterLink, CommonModule],
  templateUrl: './school-menu.html',
  styleUrls: ['./school-menu.scss'],
  standalone: true
})
export class SchoolMenu implements OnInit {
  cartItemCount = 3;

  auth = inject(AuthService);
  public schoolState = inject(SchoolStateService); // ✅ public for template access
  private route = inject(ActivatedRoute);

  // Signals for reactive display
  schoolName = computed(() => this.schoolState.currentSchool()?.name || 'School');
  schoolLogoUrl = computed(() => this.schoolState.currentSchool()?.logoUrl);

  ngOnInit() {
    // Auto set current school from URL slug if present
    const slug = this.route.snapshot.paramMap.get('schoolName');
    if (slug) this.schoolState.setSchoolBySlug(slug);
  }
}
