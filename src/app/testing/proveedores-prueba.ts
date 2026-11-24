import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { apiInterceptor } from '../services/api.interceptor';
import type { LoginResponse } from '../models/auth.model';

/** Mismos proveedores HTTP que la aplicación (con su interceptor), pero con un backend simulado. */
export function proveedoresPrueba(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideHttpClientTesting(),
    provideRouter([])
  ];
}

/** Token con forma de JWT que usan las pruebas. */
export const TOKEN_DE_PRUEBA = 'encabezado.contenido.firma';

/** Simula un usuario autenticado (token y datos) guardado en la sesión del navegador. */
export function iniciarSesionDePrueba(usuario: Partial<LoginResponse> = {}): void {
  sessionStorage.setItem('tokenAcceso', TOKEN_DE_PRUEBA);
  sessionStorage.setItem('usuarioActual', JSON.stringify({
    usuarioId: 1,
    empresaId: 2,
    nombre: 'Ana',
    correo: 'ana@empresa.com',
    rol: 'ADMINISTRADOR',
    ...usuario
  }));
}
