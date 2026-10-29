import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { ProcesoDetallePage } from './proceso-detalle.component';
import { procesoVacaciones } from '../../testing/proceso-ejemplo';
import { iniciarSesionDePrueba, proveedoresPrueba } from '../../testing/proveedores-prueba';

describe('Detalle del proceso', () => {
  let http: HttpTestingController;

  function crear(rol: 'ADMINISTRADOR' | 'EDITOR' | 'LECTURA', empresaId = 2) {
    iniciarSesionDePrueba({ rol, empresaId });
    TestBed.configureTestingModule({ imports: [ProcesoDetallePage], providers: proveedoresPrueba() });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProcesoDetallePage);
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();
    http.expectOne('/api/procesos/7').flush(procesoVacaciones());
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('dibuja el diagrama completo: pools, lanes, actividades, gateway y mensaje', () => {
    const fixture = crear('LECTURA');
    const svg: SVGElement = fixture.nativeElement.querySelector('svg');

    expect(svg.querySelectorAll('.actividad')).toHaveLength(4);
    expect(svg.querySelectorAll('.gateway')).toHaveLength(1);
    expect(svg.querySelectorAll('.evento')).toHaveLength(1);
    expect(svg.querySelectorAll('.arco')).toHaveLength(5);
    expect(svg.querySelectorAll('.mensaje')).toHaveLength(1);
    expect(svg.textContent).toContain('Jefe inmediato');
    expect(svg.textContent).toContain('Correlación: n.º de solicitud');
  });

  it('solo lectura no ve la barra para agregar elementos', () => {
    const fixture = crear('LECTURA');
    expect(fixture.componentInstance.editable()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="toolbar"]')).toBeNull();
  });

  it('un proceso compartido por otra empresa es de solo lectura aun para su administrador', () => {
    const fixture = crear('ADMINISTRADOR', 99);
    expect(fixture.componentInstance.esPropio()).toBe(false);
    expect(fixture.componentInstance.editable()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('solo lectura');
  });

  it('al arrastrar una actividad a otra lane guarda la posición y el nuevo responsable', () => {
    const fixture = crear('EDITOR');
    expect(fixture.componentInstance.editable()).toBe(true);

    fixture.componentInstance.alMover({ tipo: 'ACTIVIDAD', id: 100, posicionX: 80, posicionY: 200, laneId: 11 });

    const req = http.expectOne('/api/procesos/7/actividades/100');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      nombre: 'Radicar solicitud', tipo: 'TAREA_USUARIO', laneId: 11, posicionX: 80, posicionY: 200
    });
    req.flush({ ...procesoVacaciones().actividades[0], laneId: 11 });
    http.expectOne('/api/procesos/7').flush(procesoVacaciones());

    expect(fixture.componentInstance.mensaje()).toContain('Jefe inmediato');
  });

  it('muestra el historial con el usuario que hizo cada cambio', () => {
    const fixture = crear('EDITOR');
    fixture.componentInstance.cambiarPestana('historial');
    http.expectOne('/api/procesos/7/historial')
      .flush([{ id: 1, descripcion: "Se creó el proceso 'Solicitud de vacaciones'", usuario: 'Ana', fecha: '2026-10-28T10:00:00' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ana');
    expect(fixture.nativeElement.textContent).toContain('Se creó el proceso');
  });
});
