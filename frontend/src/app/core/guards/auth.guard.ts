import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';

/**
 * Guard that requires the user to be authenticated (any role).
 */
export const authGuard: CanActivateFn = () => {
    const userService = inject(UserService);
    const router = inject(Router);

    if (userService.isLoggedIn())
        return true;

    router.navigate(['/login']);
    return false;
};

/**
 * Guard that requires the ADMIN role.
 * Must be used together with authGuard.
 */
export const adminGuard: CanActivateFn = () => {
    const userService = inject(UserService);
    const router = inject(Router);

    if (userService.isLoggedIn() && userService.isAdmin())
        return true;

    router.navigate(['/dashboard']);
    return false;
};
