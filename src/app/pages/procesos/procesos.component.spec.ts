import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Procesos } from './procesos.component';
import { AuthService } from '../../services/auth.service';

const proceso = { id: 7, nombre: 'Compras', categoria: 'Ventas', estado: 'BORRADOR' as const, activo: true };
const pagina = { content: [proceso], number: 0, totalPages: 1, totalElements: 1 };

describe('Listado de procesos', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ usuarioId: 1, empresaId: 2, rol: 'ADMINISTRADOR' }));
    TestBed.configureTestingModule({ imports: [Procesos], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); sessionStorage.clear(); });
  function preparar() {
    const fixture = TestBed.createComponent(Procesos);
    fixture.detectChanges();
    http.expectOne(r => r.url === '/api/procesos').flush(pagina);
    fixture.detectChanges();
    return fixture;
  }
  it('muestra navegación y acciones para el administrador', () => {
    const fixture = preparar();
    expect(fixture.nativeElement.querySelector('a[href="/usuarios"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/procesos/nuevo"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Editar');
  });
  it('oculta acciones de modificación para solo lectura', () => {
    const auth = TestBed.inject(AuthService);
    auth.usuario.set({ ...auth.usuario()!, rol: 'LECTURA' });
    const fixture = preparar();
    expect(fixture.nativeElement.querySelector('a[href="/usuarios"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/procesos/nuevo"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Eliminar');
  });
  it('reinicia la paginación al buscar y permite limpiar filtros', () => {
    const component = preparar().componentInstance;
    component.pagina.set(3);
    component.filtros.controls.nombre.setValue('Compras');
    component.buscar();
    const req = http.expectOne(r => r.url === '/api/procesos');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('nombre')).toBe('Compras');
    req.flush(pagina);
    component.limpiarFiltros();
    const limpia = http.expectOne(r => r.url === '/api/procesos');
    expect(limpia.request.params.has('nombre')).toBe(false);
    limpia.flush(pagina);
  });
  it('no elimina al solicitar confirmación y retrocede cuando la página queda vacía', () => {
    const component = preparar().componentInstance;
    component.pagina.set(1);
    component.pendiente.set(proceso);
    http.expectNone(r => r.method === 'DELETE');
    component.eliminar();
    http.expectOne('/api/procesos/7?confirmar=true').flush(null);
    const req = http.expectOne(r => r.url === '/api/procesos');
    expect(req.request.params.get('page')).toBe('0');
    req.flush({ ...pagina, content: [], totalElements: 0, totalPages: 0 });
    expect(component.pendiente()).toBeNull();
    expect(component.mensaje()).toContain('desactivado');
  });
});
