import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { proveedoresPrueba } from '../testing/proveedores-prueba';

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: proveedoresPrueba() });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
  });

  it('conserva empresa y rol al entrar y los elimina al cerrar sesión', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    auth.login({ correo: 'admin@empresa.com', password: 'password123' }).subscribe();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ usuarioId: 1, empresaId: 2, nombre: 'Ana', correo: 'admin@empresa.com', rol: 'ADMINISTRADOR' });

    expect(auth.esAdministrador()).toBe(true);
    expect(auth.puedeEditar()).toBe(true);
    expect(sessionStorage.getItem('usuarioActual')).not.toContain('password123');

    auth.logout().subscribe();
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.usuario()).toBeNull();
    expect(sessionStorage.getItem('usuarioActual')).toBeNull();
  });

  it('recupera el rol después de recargar la página', () => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ usuarioId: 1, empresaId: 2, rol: 'LECTURA' }));
    const auth = TestBed.inject(AuthService);
    expect(auth.usuario()?.empresaId).toBe(2);
    expect(auth.puedeEditar()).toBe(false);
  });

  it('actualiza el rol con la sesión vigente del servidor', () => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ usuarioId: 1, empresaId: 2, rol: 'EDITOR' }));
    const auth = TestBed.inject(AuthService);

    auth.cargarSesion().subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/auth/sesion')
      .flush({ usuarioId: 1, empresaId: 2, nombre: 'Ana', correo: 'ana@empresa.com', rol: 'LECTURA' });

    expect(auth.puedeEditar()).toBe(false);
  });
});
