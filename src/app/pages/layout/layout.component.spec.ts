import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { Layout } from './layout.component';
import { AuthService } from '../../services/auth.service';
import { iniciarSesionDePrueba, proveedoresPrueba } from '../../testing/proveedores-prueba';

describe('Barra de navegación', () => {
  afterEach(() => sessionStorage.clear());

  function crear(rol: 'ADMINISTRADOR' | 'EDITOR' | 'LECTURA') {
    iniciarSesionDePrueba({ rol });
    TestBed.configureTestingModule({ imports: [Layout], providers: proveedoresPrueba() });
    const fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra la gestión de usuarios solo al administrador', () => {
    const fixture = crear('ADMINISTRADOR');
    expect(fixture.nativeElement.querySelector('a[href="/usuarios"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Empresa #2');
  });

  it('oculta la gestión de usuarios a los demás roles', () => {
    const fixture = crear('EDITOR');
    expect(fixture.nativeElement.querySelector('a[href="/usuarios"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/roles"]')).not.toBeNull();
  });

  it('cierra la sesión y vuelve al inicio', () => {
    const fixture = crear('LECTURA');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.cerrarSesion();
    TestBed.inject(HttpTestingController).expectOne('/api/auth/logout').flush(null);

    expect(TestBed.inject(AuthService).usuario()).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});
