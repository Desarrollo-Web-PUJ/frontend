// Contratos genéricos de la API REST

/** Respuesta paginada (PaginaResponseDTO del backend). */
export interface Pagina<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** Error de validación asociado a un campo. */
export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

/** Cuerpo de todas las respuestas de error (ErrorResponseDTO del backend). */
export interface ErrorApi {
  mensaje: string;
  errores: ErrorCampo[];
}

/** Respuesta de las eliminaciones que pueden generar advertencias de coherencia. */
export interface ResultadoEliminacion {
  mensaje: string;
  advertencias: string[];
}
