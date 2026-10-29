import type { EventoMensaje, EventoMensajeRequest, TipoNodo } from '../../../models/diagrama.model';
import type { ProcesoDetalle } from '../../../models/proceso.model';

/** Nodo que puede ser origen o destino de un arco, con un nombre legible. */
export interface OpcionNodo {
  valor: string;
  tipo: TipoNodo;
  id: number;
  poolId: number | null;
  etiqueta: string;
}

/** Codifica tipo e id en un solo valor para los <select>. */
export function valorNodo(tipo: TipoNodo, id: number): string {
  return `${tipo}:${id}`;
}

export function leerValorNodo(valor: string): { tipo: TipoNodo; id: number } | null {
  const [tipo, id] = valor.split(':');
  const numero = Number(id);
  if (!tipo || !Number.isInteger(numero)) return null;
  return { tipo: tipo as TipoNodo, id: numero };
}

/** Todos los nodos del proceso que pueden conectarse con arcos, agrupados por pool. */
export function opcionesNodos(detalle: ProcesoDetalle): OpcionNodo[] {
  const poolDeLane = new Map(detalle.lanes.map(lane => [lane.id, lane.poolId]));
  const nombrePool = new Map(detalle.pools.map(pool => [pool.id, pool.nombre]));
  const prefijo = (poolId: number | null) => (poolId != null ? `${nombrePool.get(poolId)} › ` : '');

  return [
    ...detalle.actividades.map(a => {
      const poolId = poolDeLane.get(a.laneId) ?? null;
      return {
        valor: valorNodo('ACTIVIDAD', a.id), tipo: 'ACTIVIDAD' as const, id: a.id, poolId,
        etiqueta: `${prefijo(poolId)}Actividad: ${a.nombre}`
      };
    }),
    ...detalle.gateways.map(g => ({
      valor: valorNodo('GATEWAY', g.id), tipo: 'GATEWAY' as const, id: g.id, poolId: g.poolId,
      etiqueta: `${prefijo(g.poolId)}Gateway ${g.tipo.toLowerCase()} #${g.id}`
    })),
    ...detalle.eventosMensaje.map(e => ({
      valor: valorNodo('EVENTO', e.id), tipo: 'EVENTO' as const, id: e.id, poolId: e.poolId,
      etiqueta: `${prefijo(e.poolId)}Evento: ${e.nombreMensaje} (${e.tipo === 'THROW' ? 'envía' : 'recibe'})`
    }))
  ];
}

/** Petición de edición de un evento a partir de sus datos actuales. */
export function eventoARequest(evento: EventoMensaje, cambios: Partial<EventoMensajeRequest> = {}): EventoMensajeRequest {
  return {
    tipo: evento.tipo,
    poolId: evento.poolId,
    laneId: evento.laneId,
    nombreMensaje: evento.nombreMensaje,
    claveCorrelacion: evento.claveCorrelacion,
    comportamientoSinCorrelacion: evento.comportamientoSinCorrelacion,
    origenExterno: evento.origenExterno,
    tipoDestinoExterno: evento.tipoDestinoExterno,
    comportamientoFallo: evento.comportamientoFallo,
    campos: evento.campos,
    actividadesConsumidoras: evento.actividadesConsumidoras,
    posicionX: evento.posicionX,
    posicionY: evento.posicionY,
    ...cambios
  };
}
