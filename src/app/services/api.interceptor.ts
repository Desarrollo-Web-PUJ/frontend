import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Interceptor de todas las peticiones a la API:
 *  - envía la cookie de sesión (withCredentials) sin repetirlo en cada servicio;
 *  - si el servidor responde 401 fuera del login, la sesión expiró: se limpia
 *    el estado local y se lleva al usuario al inicio de sesión.
 */
export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const esApi = request.url.startsWith('/api');
  const peticion = esApi ? request.clone({ withCredentials: true }) : request;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      const sesionExpirada = error instanceof HttpErrorResponse
        && error.status === 401
        && esApi
        && !request.url.startsWith('/api/auth/');

      if (sesionExpirada) {
        auth.limpiarSesion();
        void router.navigate(['/login'], { queryParams: { sesion: 'expirada' } });
      }
      return throwError(() => error);
    })
  );
};
