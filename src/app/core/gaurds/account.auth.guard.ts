import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '@angular/fire/auth';

/**
 * A guard that checks if a user is authenticated.
 * If the user is not authenticated, it redirects them to the director login page.
 *
 * @returns A promise that resolves to `true` if the user is authenticated,
 * or a `UrlTree` to redirect to the login page.
 */
export const AccountAuthGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user ? true : router.createUrlTree(['/account-login']));
    });
  });
};