import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home-menu',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-menu.html',
  styleUrls: ['./home-menu.scss']
})
export class HomeMenu {
  cartItemCount = 3;

  constructor(public auth: AuthService) {}
}
