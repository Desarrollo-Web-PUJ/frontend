import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { authGuard } from './auth.guard';
import { proveedoresPrueba } from '../testing/proveedores-prueba';

describe('authGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: proveedoresPrueba() }));
  afterEach(() => sessionStorage.clear());

  function ejecutar(): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)) as Observable<boolean | UrlTree>;
  }

  it('permite entrar con una sesión válida en el servidor', () => {
    let resultado: boolean | UrlTree | undefined;
    ejecutar().subscribe(valor => resultado = valor);
    TestBed.inject(HttpTestingController).expectOne('/api/auth/sesion')
      .flush({ usuarioId: 1, empresaId: 2, nombre: 'Ana', correo: 'ana@empresa.com', rol: 'EDITOR' });
    expect(resultado).toBe(true);
  });

  it('lleva al inicio de sesión cuando la sesión no es válida', () => {
    let resultado: boolean | UrlTree | undefined;
    ejecutar().subscribe(valor => resultado = valor);
    TestBed.inject(HttpTestingController).expectOne('/api/auth/sesion')
      .flush({ mensaje: 'Debe iniciar sesión', errores: [] }, { status: 401, statusText: 'Unauthorized' });
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/login');
  });
});
