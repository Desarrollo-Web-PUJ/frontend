import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { RolesProceso } from './roles-proceso.component';
import { iniciarSesionDePrueba, proveedoresPrueba } from '../../testing/proveedores-prueba';

const analista = { id: 1, nombre: 'Analista', descripcion: null, procesos: [{ id: 7, nombre: 'Compras' }], enUso: true, eliminable: false };
const auditor = { id: 2, nombre: 'Auditor', descripcion: 'Revisa', procesos: [], enUso: false, eliminable: true };
const pagina = { content: [analista, auditor], number: 0, size: 10, totalElements: 2, totalPages: 1, first: true, last: true };

describe('Roles de proceso', () => {
  let http: HttpTestingController;

  function crear(rol: 'ADMINISTRADOR' | 'LECTURA' = 'ADMINISTRADOR') {
    iniciarSesionDePrueba({ rol });
    TestBed.configureTestingModule({ imports: [RolesProceso], providers: proveedoresPrueba() });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(RolesProceso);
    fixture.detectChanges();
    http.expectOne(r => r.url === '/api/roles-proceso').flush(pagina);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('lista los roles con los procesos donde se usan y bloquea eliminar los que están en uso', () => {
    const fixture = crear();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Analista');
    expect(texto).toContain('Compras');
    expect(texto).toContain('En uso');

    const botonesEliminar = [...fixture.nativeElement.querySelectorAll('button.peligro')] as HTMLButtonElement[];
    expect(botonesEliminar[0].disabled).toBe(true);
    expect(botonesEliminar[1].disabled).toBe(false);
  });

  it('crea un rol con los datos limpios y recarga el listado', () => {
    const component = crear().componentInstance;
    component.form.setValue({ nombre: '  Supervisor ', descripcion: '  ' });
    component.guardar();

    const req = http.expectOne('/api/roles-proceso');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Supervisor', descripcion: null });
    req.flush({ id: 3, nombre: 'Supervisor', descripcion: null });
    http.expectOne(r => r.url === '/api/roles-proceso' && r.method === 'GET').flush(pagina);

    expect(component.mensaje()).toContain('Supervisor');
  });

  it('busca por nombre desde la primera página', () => {
    const component = crear().componentInstance;
    component.pagina.set(2);
    component.busqueda.setValue('audi');
    component.buscar();

    const req = http.expectOne(r => r.url === '/api/roles-proceso');
    expect(req.request.params.get('nombre')).toBe('audi');
    expect(req.request.params.get('page')).toBe('0');
    req.flush(pagina);
  });

  it('solo el administrador ve el formulario de creación', () => {
    const fixture = crear('LECTURA');
    expect(fixture.nativeElement.querySelector('form.tarjeta')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Solo el administrador');
  });
});
