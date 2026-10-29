import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Permite entrar al área privada solo con una sesión válida en el servidor.
 * Además refresca el rol y la empresa del usuario por si cambiaron.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.cargarSesion().pipe(
    map(() => true),
    catchError(() => {
      auth.limpiarSesion();
      return of(router.createUrlTree(['/login']));
    })
  );
};
