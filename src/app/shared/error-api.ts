import { HttpErrorResponse } from '@angular/common/http';

// Mostramos tanto los errores generales como las validaciones enviadas por la API.
export function mensajeApi(error: HttpErrorResponse): string {
  if (error.status === 0 || error.status === 502) return 'No se pudo conectar con el servidor. Intenta nuevamente.';
  if (error.status === 401) return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
  if (error.error && typeof error.error === 'object') {
    const mensajes = Object.values(error.error).filter((valor): valor is string => typeof valor === 'string');
    if (mensajes.length) return mensajes.join(' ');
  }
  if (error.status === 403) return 'No tienes permiso para realizar esta acción.';
  if (error.status === 404) return 'El registro solicitado no existe.';
  return 'No se pudo completar la operación. Intenta nuevamente.';
}
