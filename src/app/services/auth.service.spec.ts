import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { proveedoresPrueba } from '../testing/proveedores-prueba';

const USUARIO = { usuarioId: 1, empresaId: 2, nombre: 'Ana', correo: 'admin@empresa.com', rol: 'ADMINISTRADOR' };

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: proveedoresPrueba() });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
  });

  it('guarda el JWT, la empresa y el rol al entrar y los elimina al cerrar sesión', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    auth.login({ correo: 'admin@empresa.com', password: 'password123' }).subscribe();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ token: 'a.b.c', tipo: 'Bearer', expiraEnSegundos: 3600, usuario: USUARIO });

    expect(auth.token()).toBe('a.b.c');
    expect(sessionStorage.getItem('tokenAcceso')).toBe('a.b.c');

    expect(auth.esAdministrador()).toBe(true);
    expect(auth.puedeEditar()).toBe(true);
    expect(sessionStorage.getItem('usuarioActual')).not.toContain('password123');

    auth.logout().subscribe();
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.usuario()).toBeNull();
    expect(auth.token()).toBeNull();
    expect(sessionStorage.getItem('usuarioActual')).toBeNull();
    expect(sessionStorage.getItem('tokenAcceso')).toBeNull();
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
