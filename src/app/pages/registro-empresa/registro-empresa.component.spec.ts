import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { RegistroEmpresa } from './registro-empresa.component';
import { proveedoresPrueba } from '../../testing/proveedores-prueba';

const datosValidos = {
  nombre: ' Acme S.A.S. ',
  nit: ' 900123456 ',
  correoContacto: 'contacto@acme.com',
  adminNombre: ' Ana Pérez ',
  adminCorreo: 'ana@acme.com',
  adminPassword: 'password123',
  confirmarPassword: 'password123'
};

describe('Registro de empresa', () => {
  let http: HttpTestingController;

  function crear() {
    TestBed.configureTestingModule({ imports: [RegistroEmpresa], providers: proveedoresPrueba() });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RegistroEmpresa);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => http.verify());

  it('no envía si las contraseñas no coinciden', () => {
    const component = crear();
    component.form.setValue({ ...datosValidos, confirmarPassword: 'otra-clave' });
    component.registrar();
    expect(component.form.hasError('noCoinciden')).toBe(true);
    http.expectNone('/api/empresas/registro');
  });

  it('registra la empresa con datos limpios y sin la confirmación', () => {
    const component = crear();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.form.setValue(datosValidos);
    component.registrar();

    const req = http.expectOne('/api/empresas/registro');
    expect(req.request.body).toEqual({
      nombre: 'Acme S.A.S.',
      nit: '900123456',
      correoContacto: 'contacto@acme.com',
      adminNombre: 'Ana Pérez',
      adminCorreo: 'ana@acme.com',
      adminPassword: 'password123'
    });
    req.flush({ id: 5, nombre: 'Acme S.A.S.', nit: '900123456', correoContacto: 'contacto@acme.com', adminUsuarioId: 9 });

    expect(navegar).toHaveBeenCalledWith(['/login'], { state: { registro: true, correo: 'ana@acme.com' } });
  });

  it('muestra el error del servidor cuando el NIT ya existe', () => {
    const component = crear();
    component.form.setValue(datosValidos);
    component.registrar();
    http.expectOne('/api/empresas/registro')
      .flush({ mensaje: 'Ya existe una empresa registrada con ese NIT', errores: [] }, { status: 409, statusText: 'Conflict' });
    expect(component.error()).toContain('NIT');
  });
});
