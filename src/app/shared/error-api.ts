import { HttpErrorResponse } from '@angular/common/http';

import type { ErrorApi } from '../models/api.model';

/**
 * Convierte un error HTTP en un mensaje legible para el usuario.
 * El backend responde siempre con { mensaje, errores[] } (ErrorResponseDTO).
 */
export function mensajeApi(error: HttpErrorResponse): string {
  if (error.status === 0 || error.status === 502 || error.status === 504) {
    return 'No se pudo conectar con el servidor. Intenta nuevamente.';
  }

  const cuerpo = error.error as Partial<ErrorApi> | null;

  if (cuerpo && typeof cuerpo === 'object' && typeof cuerpo.mensaje === 'string') {
    const errores = Array.isArray(cuerpo.errores) ? cuerpo.errores : [];
    if (errores.length) {
      return `${cuerpo.mensaje}: ${errores.map(e => e.mensaje).join('. ')}`;
    }
    return cuerpo.mensaje;
  }

  switch (error.status) {
    case 401: return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
    case 403: return 'No tienes permiso para realizar esta acción.';
    case 404: return 'El registro solicitado no existe.';
    default: return 'No se pudo completar la operación. Intenta nuevamente.';
  }
}
