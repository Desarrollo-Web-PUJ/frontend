import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/** Rutas de inicio de sesión y registro: no llevan token (uno vencido no debe impedir entrar). */
const RUTAS_PUBLICAS = ['/api/auth/login', '/api/auth/token', '/api/empresas/registro'];

/**
 * Interceptor de todas las peticiones a la API:
 *  - agrega el JWT en el encabezado "Authorization: Bearer <token>" sin
 *    repetirlo en cada servicio;
 *  - si el servidor responde 401 fuera del login, el token venció o no es
 *    válido: se limpia el estado local y se lleva al usuario al inicio de sesión.
 */
export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const esApi = request.url.startsWith('/api');
  const esPublica = RUTAS_PUBLICAS.some(ruta => request.url.startsWith(ruta));
  const token = auth.token();

  const peticion = esApi && !esPublica && token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

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
