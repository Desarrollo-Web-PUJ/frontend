import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Usuarios } from './usuarios.component';

const colaborador = { id: 8, empresaId: 2, nombre: 'Luis', correo: 'luis@empresa.com', rol: 'LECTURA' as const, activo: true };

describe('Usuarios de la empresa', () => {
  let component: Usuarios;
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ usuarioId: 1, empresaId: 2, rol: 'ADMINISTRADOR' }));
    TestBed.configureTestingModule({ imports: [Usuarios], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const fixture = TestBed.createComponent(Usuarios);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/empresas/2/usuarios').flush([colaborador]);
  });
  afterEach(() => { http.verify(); sessionStorage.clear(); });

  it('rechaza correos inválidos y contraseñas cortas', () => {
    component.form.patchValue({ nombre: 'Luis', correo: 'incorrecto', password: '123' });
    component.registrar();
    http.expectNone('/api/empresas/2/usuarios/registro');
    expect(component.form.invalid).toBe(true);
  });
  it('registra dentro de la empresa de la sesión y limpia la contraseña al finalizar', () => {
    component.form.setValue({ nombre: ' Luis ', correo: 'luis@empresa.com', password: 'password123', rol: 'EDITOR' });
    component.registrar();
    const req = http.expectOne('/api/empresas/2/usuarios/registro');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body.nombre).toBe('Luis');
    expect(req.request.body.rol).toBe('EDITOR');
    req.flush(colaborador);
    http.expectOne('/api/empresas/2/usuarios').flush([colaborador]);
    expect(component.form.controls.password.value).toBe('');
  });
  it('actualiza el rol con el contrato de la API', () => {
    component.elegirRol(8, 'EDITOR');
    component.cambiarRol(colaborador);
    const req = http.expectOne('/api/empresas/2/usuarios/8/rol');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ rol: 'EDITOR' });
    req.flush({ ...colaborador, rol: 'EDITOR' });
    http.expectOne('/api/empresas/2/usuarios').flush([{ ...colaborador, rol: 'EDITOR' }]);
    expect(component.usuarios()[0].rol).toBe('EDITOR');
  });
  it('solo desactiva después de confirmar y conserva el error del servidor', () => {
    component.pendiente.set(colaborador);
    http.expectNone('/api/empresas/2/usuarios/8/desactivar');
    component.desactivar();
    const req = http.expectOne('/api/empresas/2/usuarios/8/desactivar');
    expect(req.request.method).toBe('PATCH');
    req.flush({ mensaje: 'No tienes permiso' }, { status: 403, statusText: 'Forbidden' });
    expect(component.error()).toBe('No tienes permiso');
    expect(component.usuarios()[0].activo).toBe(true);
  });
});
