import { Component } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { HomeMenu } from '../../Navbar/home-menu/home-menu';

interface School {
  id: string;
  name: string;
  logoUrl: string;
  city: string;
  address: string;
  curriculum_type: string;
  ownership_type: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,RouterOutlet,HomeMenu],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home {
  schools$!: Observable<School[]>;

  constructor(private firestore: Firestore, private router: Router) {
    const colRef = collection(this.firestore, 'schools');
    // 🔥 collectionData handles InjectionContext for you
    this.schools$ = collectionData(colRef, { idField: 'id' }) as Observable<School[]>;
  }

  goToLogin(schoolCode: string) {
    this.router.navigate(['/login', schoolCode]);
  }
}
