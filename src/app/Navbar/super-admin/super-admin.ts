import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, Admin } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-super-admin',
  imports: [RouterLink, CommonModule],
  templateUrl: './super-admin.html',
  styleUrl: './super-admin.scss'
})
export class SuperAdmin implements OnInit {
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
