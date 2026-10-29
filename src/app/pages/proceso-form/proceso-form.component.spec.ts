import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ProcesoForm } from './proceso-form.component';
import { proveedoresPrueba } from '../../testing/proveedores-prueba';

describe('Formulario de proceso', () => {
  function preparar(id?: string) {
    TestBed.configureTestingModule({
      imports: [ProcesoForm],
      providers: [...proveedoresPrueba(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }]
    });
    const fixture = TestBed.createComponent(ProcesoForm);
    const http = TestBed.inject(HttpTestingController);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, http, navegar };
  }
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('no envía formularios vacíos ni nombres compuestos por espacios', () => {
    const { component, http } = preparar();
    component.form.patchValue({ nombre: '   ', categoria: 'Ventas' });
    component.guardar();
    expect(component.form.invalid).toBe(true);
    http.expectNone('/api/procesos');
  });
  it('crea sin estado y evita envíos duplicados mientras guarda', () => {
    const { component, http, navegar } = preparar();
    component.form.patchValue({ nombre: ' Compras ', categoria: ' Ventas ', descripcion: ' Descripción ' });
    component.guardar();
    component.guardar();
    const req = http.expectOne('/api/procesos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Compras', categoria: 'Ventas', descripcion: 'Descripción' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ id: 1 });
    expect(navegar).toHaveBeenCalledWith(['/procesos'], { state: { mensaje: 'Proceso creado correctamente.' } });
  });
  it('carga el detalle y envía el estado al editar', () => {
    const { component, http } = preparar('7');
    expect(component.disponible()).toBe(false);
    http.expectOne('/api/procesos/7').flush({ id: 7, nombre: 'Compras', categoria: 'Ventas', descripcion: null, estado: 'BORRADOR', activo: true });
    expect(component.form.controls.nombre.value).toBe('Compras');
    component.form.controls.estado.setValue('PUBLICADO');
    component.guardar();
    const req = http.expectOne('/api/procesos/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.estado).toBe('PUBLICADO');
    expect(req.request.body.descripcion).toBe('');
    req.flush({ id: 7 });
  });
  it('impide editar un proceso inactivo', () => {
    const { component, http } = preparar('7');
    http.expectOne('/api/procesos/7').flush({ activo: false });
    component.guardar();
    expect(component.disponible()).toBe(false);
    expect(component.errorCarga()).toContain('inactivo');
    http.expectNone('/api/procesos/7');
  });
  it('conserva el formulario si el servidor rechaza un nombre repetido', () => {
    const { component, http, navegar } = preparar();
    component.form.patchValue({ nombre: 'Compras', categoria: 'Ventas' });
    component.guardar();
    http.expectOne('/api/procesos').flush({ mensaje: 'Ya existe un proceso con ese nombre' }, { status: 409, statusText: 'Conflict' });
    expect(component.error()).toContain('Ya existe');
    expect(component.form.controls.nombre.value).toBe('Compras');
    expect(component.guardando()).toBe(false);
    expect(navegar).not.toHaveBeenCalled();
  });
});
