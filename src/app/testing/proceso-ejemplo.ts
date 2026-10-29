import type { ProcesoDetalle } from '../models/proceso.model';

/**
 * El proceso de "solicitud de vacaciones" del enunciado del proyecto,
 * modelado con todos los elementos del sistema. Se usa en las pruebas.
 */
export function procesoVacaciones(): ProcesoDetalle {
  return {
    id: 7,
    nombre: 'Solicitud de vacaciones',
    descripcion: 'Proceso de ejemplo del enunciado',
    categoria: 'Talento humano',
    estado: 'BORRADOR',
    activo: true,
    empresaId: 2,
    pools: [
      { id: 1, nombre: 'Empresa', tipo: 'PROPIO', procesoId: 7, cantidadLanes: 3 },
      { id: 2, nombre: 'Servicio de correo', tipo: 'EXTERNO', procesoId: 7, cantidadLanes: 0 }
    ],
    lanes: [
      { id: 10, nombre: 'Empleado', procesoId: 7, poolId: 1, rolProcesoId: 1, orden: 0 },
      { id: 11, nombre: 'Jefe inmediato', procesoId: 7, poolId: 1, rolProcesoId: 2, orden: 1 },
      { id: 12, nombre: 'Talento Humano', procesoId: 7, poolId: 1, rolProcesoId: 3, orden: 2 }
    ],
    actividades: [
      { id: 100, nombre: 'Radicar solicitud', tipo: 'TAREA_USUARIO', procesoId: 7, laneId: 10, laneNombre: 'Empleado', poolId: 1, posicionX: 36, posicionY: null },
      { id: 101, nombre: 'Revisar solicitud', tipo: 'TAREA_USUARIO', procesoId: 7, laneId: 11, laneNombre: 'Jefe inmediato', poolId: 1, posicionX: 216, posicionY: null },
      { id: 102, nombre: 'Registrar rechazo', tipo: 'TAREA_MANUAL', procesoId: 7, laneId: 11, laneNombre: 'Jefe inmediato', poolId: 1, posicionX: 520, posicionY: null },
      { id: 103, nombre: 'Actualizar días', tipo: 'TAREA_SERVICIO', procesoId: 7, laneId: 12, laneNombre: 'Talento Humano', poolId: 1, posicionX: 520, posicionY: null }
    ],
    gateways: [
      { id: 200, procesoId: 7, poolId: 1, tipo: 'EXCLUSIVO', posicionX: 400, posicionY: 195 }
    ],
    arcos: [
      { id: 500, procesoId: 7, tipoOrigen: 'ACTIVIDAD', origenId: 100, tipoDestino: 'ACTIVIDAD', destinoId: 101, etiqueta: null, condicion: null },
      { id: 501, procesoId: 7, tipoOrigen: 'ACTIVIDAD', origenId: 101, tipoDestino: 'GATEWAY', destinoId: 200, etiqueta: null, condicion: null },
      { id: 502, procesoId: 7, tipoOrigen: 'GATEWAY', origenId: 200, tipoDestino: 'ACTIVIDAD', destinoId: 102, etiqueta: null, condicion: 'No' },
      { id: 503, procesoId: 7, tipoOrigen: 'GATEWAY', origenId: 200, tipoDestino: 'ACTIVIDAD', destinoId: 103, etiqueta: null, condicion: 'Sí' },
      { id: 504, procesoId: 7, tipoOrigen: 'ACTIVIDAD', origenId: 103, tipoDestino: 'EVENTO', destinoId: 300, etiqueta: null, condicion: null }
    ],
    eventosMensaje: [
      {
        id: 300, procesoId: 7, poolId: 1, poolNombre: 'Empresa', laneId: 12, laneNombre: 'Talento Humano',
        tipo: 'THROW', nombreMensaje: 'NotificarAprobación', claveCorrelacion: 'n.º de solicitud',
        correlacionDefinida: true, comportamientoSinCorrelacion: null, origenExterno: false,
        tipoDestinoExterno: 'CORREO', comportamientoFallo: 'CONTINUAR',
        campos: [{ nombre: 'numeroSolicitud', tipoDato: 'Texto' }], actividadesConsumidoras: [],
        posicionX: 720, posicionY: null
      }
    ],
    flujosMensaje: [
      { id: 400, procesoId: 7, origenId: 300, destinoId: null, poolDestinoId: 2, etiqueta: null }
    ]
  };
}
