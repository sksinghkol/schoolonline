import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,           // 🔹 required for imports
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']   // 🔹 fixed typo
})
export class App {
  protected readonly title = signal('school');
}
