import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, Admin } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './admin-menu.html',
  styleUrls: ['./admin-menu.scss']
})
export class AdminMenu implements OnInit {
  username: string = '';
  phoneNumber: string = '';
  cartItemCount: number = 0;
  currentUser$: Observable<Admin | null>;

  constructor(private auth: AuthService) {
    // Use the public observable getter
    this.currentUser$ = this.auth.user$;
  }

  ngOnInit(): void {
    // Subscribe to the observable to update template data
    this.currentUser$.subscribe(user => {
      if (user) {
        this.username = user.displayName || 'Admin';
        this.phoneNumber = user.email || '';
      }
    });
  }
}
