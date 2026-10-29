import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { iniciarSesionDePrueba, proveedoresPrueba } from '../testing/proveedores-prueba';

describe('Interceptor de la API', () => {
  let http: HttpTestingController;
  let cliente: HttpClient;

  beforeEach(() => {
    iniciarSesionDePrueba();
    TestBed.configureTestingModule({ providers: proveedoresPrueba() });
    http = TestBed.inject(HttpTestingController);
    cliente = TestBed.inject(HttpClient);
  });
  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('envía la cookie de sesión en las peticiones a la API', () => {
    cliente.get('/api/procesos').subscribe();
    expect(http.expectOne('/api/procesos').request.withCredentials).toBe(true);
  });

  it('cierra la sesión local y redirige al login cuando la sesión expira', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    cliente.get('/api/procesos').subscribe({ error: () => undefined });
    http.expectOne('/api/procesos').flush({ mensaje: 'Sesión expirada', errores: [] }, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(AuthService).usuario()).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { sesion: 'expirada' } });
  });

  it('no redirige cuando falla el propio inicio de sesión', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    cliente.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/auth/login').flush({ mensaje: 'Correo o contraseña incorrectos', errores: [] }, { status: 401, statusText: 'Unauthorized' });

    expect(navegar).not.toHaveBeenCalled();
  });
});
