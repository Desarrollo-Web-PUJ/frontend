import { procesoVacaciones } from '../../../testing/proceso-ejemplo';
import { DIMENSIONES, ORIGEN_X, calcularLayout, partirTexto, siguientePosicionX } from './diagrama-layout';

describe('Geometría del diagrama', () => {
  it('ubica el pool propio primero y divide su altura en una banda por lane', () => {
    const layout = calcularLayout(procesoVacaciones());

    expect(layout.pools.map(b => b.pool.nombre)).toEqual(['Empresa', 'Servicio de correo']);
    const empresa = layout.pools[0];
    expect(empresa.lanes.map(l => l.lane.nombre)).toEqual(['Empleado', 'Jefe inmediato', 'Talento Humano']);
    expect(empresa.alto).toBe(3 * DIMENSIONES.altoLane);
    expect(layout.pools[1].alto).toBe(DIMENSIONES.altoPoolExterno);
  });

  it('dibuja cada actividad dentro de la banda de su lane y en su posición horizontal', () => {
    const layout = calcularLayout(procesoVacaciones());
    const revisar = layout.actividades.find(n => n.actividad.nombre === 'Revisar solicitud')!.caja;
    const banda = layout.pools[0].lanes.find(l => l.lane.nombre === 'Jefe inmediato')!;

    expect(revisar.x).toBe(ORIGEN_X + 216);
    expect(revisar.y).toBeGreaterThanOrEqual(banda.y);
    expect(revisar.y + revisar.alto).toBeLessThanOrEqual(banda.y + banda.alto);
  });

  it('traza arcos con condición y el mensaje hacia el participante externo', () => {
    const layout = calcularLayout(procesoVacaciones());

    expect(layout.arcos).toHaveLength(5);
    expect(layout.arcos.find(a => a.id === 503)!.texto).toBe('Sí');
    expect(layout.mensajes).toHaveLength(1);
    expect(layout.mensajes[0].texto).toBe('NotificarAprobación');
    expect(layout.mensajes[0].correlacion).toBe('n.º de solicitud');
  });

  it('aplica el desplazamiento temporal de un nodo arrastrado', () => {
    const sinMover = calcularLayout(procesoVacaciones());
    const movido = calcularLayout(procesoVacaciones(), { clave: 'ACTIVIDAD-100', dx: 40, dy: 0 });
    const x = (l: typeof sinMover) => l.actividades.find(n => n.actividad.id === 100)!.caja.x;
    expect(x(movido)).toBe(x(sinMover) + 40);
  });

  it('propone la siguiente posición libre del pool para un elemento nuevo', () => {
    const x = siguientePosicionX(procesoVacaciones(), 1);
    expect(x).toBeGreaterThan(720 + DIMENSIONES.diametroEvento);
  });

  it('parte los nombres largos en varias líneas', () => {
    expect(partirTexto('Registrar rechazo de la solicitud', 18)).toEqual(['Registrar rechazo', 'de la solicitud']);
  });
});
