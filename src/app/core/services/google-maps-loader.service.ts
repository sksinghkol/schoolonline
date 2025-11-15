import { Injectable, inject } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private readonly _scriptLoaded = new ReplaySubject<void>(1);
  public readonly scriptLoaded$ = this._scriptLoaded.asObservable();

  constructor() {
    this.loadScript();
  }

  private loadScript(): void {
    // Check if the script is already on the page
    if (window.google && window.google.maps) {
      this._scriptLoaded.next();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.firebase.apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      this._scriptLoaded.next();
    };

    script.onerror = () => {
      console.error('Google Maps script failed to load.');
      this._scriptLoaded.error('Google Maps script failed to load.');
    };

    document.head.appendChild(script);
  }
}