import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { rolGuard } from './rol.guard';
import { AuthService } from '../services/auth.service';

describe('Restricciones de rutas por rol', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });
  function comprobar(roles: string[]) {
    return TestBed.runInInjectionContext(() => rolGuard({ data: { roles } } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  }
  it('pide iniciar sesión si no hay datos de la empresa', () => {
    const resultado = comprobar(['ADMINISTRADOR']);
    expect(TestBed.inject(Router).serializeUrl(resultado as any)).toBe('/login');
  });
  it('impide a un editor entrar directamente a gestionar usuarios', () => {
    TestBed.inject(AuthService).usuario.set({ usuarioId: 1, empresaId: 2, rol: 'EDITOR', nombre: 'Ana', correo: 'ana@empresa.com' });
    expect(TestBed.inject(Router).serializeUrl(comprobar(['ADMINISTRADOR']) as any)).toBe('/procesos');
    expect(comprobar(['ADMINISTRADOR', 'EDITOR'])).toBe(true);
  });
});
