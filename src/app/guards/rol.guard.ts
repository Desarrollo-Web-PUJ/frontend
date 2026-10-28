import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Esto organiza la navegación; el servidor vuelve a comprobar los permisos.
export const rolGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.usuario()) return router.createUrlTree(['/login']);
  return route.data['roles'].includes(auth.usuario()!.rol)
    ? true : router.createUrlTree(['/procesos']);
};
