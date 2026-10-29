import { HttpErrorResponse } from '@angular/common/http';

import { mensajeApi } from './error-api';

describe('mensajeApi', () => {
  it('usa el mensaje del cuerpo de error de la API', () => {
    const error = new HttpErrorResponse({ status: 409, error: { mensaje: 'Ya existe un proceso con ese nombre', errores: [] } });
    expect(mensajeApi(error)).toBe('Ya existe un proceso con ese nombre');
  });

  it('incluye los errores de validación por campo', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { mensaje: 'Hay datos inválidos en la solicitud', errores: [{ campo: 'correo', mensaje: 'El correo no es válido' }] }
    });
    expect(mensajeApi(error)).toBe('Hay datos inválidos en la solicitud: El correo no es válido');
  });

  it('explica cuando no hay conexión con el servidor', () => {
    expect(mensajeApi(new HttpErrorResponse({ status: 0 }))).toContain('No se pudo conectar');
  });

  it('da un mensaje según el código cuando la respuesta no trae cuerpo', () => {
    expect(mensajeApi(new HttpErrorResponse({ status: 403 }))).toContain('permiso');
    expect(mensajeApi(new HttpErrorResponse({ status: 404 }))).toContain('no existe');
  });
});
