
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';

import { ProcesoService } from '../services/proceso.service';

export const authGuard: CanActivateFn = () => {

  const procesoService = inject(ProcesoService);
  const router = inject(Router);

  return procesoService.listar({
    page: 0,
    size: 1
  }).pipe(

    
    map(() => true),

    catchError((error: HttpErrorResponse) => {

      // Usuario sin sesión válida
      if (error.status === 401 || error.status === 403) {
        return of(router.createUrlTree(['/login']));
      }

      console.error('No se pudo verificar la sesion:', error);
      return of(false);
    })
  );
};
