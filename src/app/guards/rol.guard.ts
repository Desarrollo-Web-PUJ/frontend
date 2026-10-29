import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import type { RolUsuario } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

/**
 * Restringe una ruta a ciertos roles de acceso (data.roles).
 * Solo organiza la navegación: el servidor vuelve a comprobar cada permiso.
 */
export const rolGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = auth.usuario();

  if (!usuario) {
    return router.createUrlTree(['/login']);
  }

  const rolesPermitidos = (route.data['roles'] ?? []) as RolUsuario[];
  return rolesPermitidos.includes(usuario.rol) ? true : router.createUrlTree(['/procesos']);
};
