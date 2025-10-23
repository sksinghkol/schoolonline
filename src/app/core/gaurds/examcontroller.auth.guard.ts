import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '@angular/fire/auth';

/**
 * A guard that checks if a user is authenticated.
 * If the user is not authenticated, it redirects them to the exam controller login page.
 */
export const ExamcontrollerAuthGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user ? true : router.createUrlTree(['/examcontroller-login']));
    });
  });
};