import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProcesoService } from './proceso.service';

describe('ProcesoService', () => {
  let servicio: ProcesoService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(ProcesoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('envía filtros y paginación con la cookie de sesión', () => {
    servicio.listar({ nombre: ' Compras ', categoria: ' Ventas ', estado: 'BORRADOR', incluirInactivos: true, page: 2 }).subscribe();
    const req = http.expectOne(r => r.url === '/api/procesos');
    expect(req.request.params.get('nombre')).toBe('Compras');
    expect(req.request.params.get('categoria')).toBe('Ventas');
    expect(req.request.params.get('estado')).toBe('BORRADOR');
    expect(req.request.params.get('incluirInactivos')).toBe('true');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ content: [] });
  });

  it('confirma explícitamente la eliminación lógica', () => {
    servicio.eliminar(7).subscribe();
    const req = http.expectOne('/api/procesos/7?confirmar=true');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.withCredentials).toBe(true);
    req.flush(null);
  });
});
