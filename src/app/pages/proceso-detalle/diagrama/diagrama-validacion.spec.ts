import { procesoVacaciones } from '../../../testing/proceso-ejemplo';
import { validarDiagrama } from './diagrama-validacion';

describe('Revisión de coherencia del diagrama', () => {
  it('no reporta problemas en el proceso de ejemplo del enunciado', () => {
    expect(validarDiagrama(procesoVacaciones())).toEqual([]);
  });

  it('advierte arcos sin condición que salen de un gateway exclusivo', () => {
    const proceso = procesoVacaciones();
    proceso.arcos = proceso.arcos.map(a => (a.id === 502 ? { ...a, condicion: null } : a));
    expect(validarDiagrama(proceso)).toContain('El gateway exclusivo #200 tiene arcos de salida sin condición.');
  });

  it('advierte actividades desconectadas y mensajes sin destino', () => {
    const proceso = procesoVacaciones();
    proceso.arcos = proceso.arcos.filter(a => a.id !== 500);
    proceso.flujosMensaje = [];

    const advertencias = validarDiagrama(proceso);
    expect(advertencias).toContain('La actividad "Radicar solicitud" no está conectada a ningún arco.');
    expect(advertencias).toContain('El Message Throw "NotificarAprobación" no envía su mensaje a ningún participante.');
  });

  it('advierte un pool de la empresa sin lanes', () => {
    const proceso = procesoVacaciones();
    proceso.lanes = [];
    proceso.actividades = [];
    expect(validarDiagrama(proceso)[0]).toContain('no tiene lanes');
  });
});
