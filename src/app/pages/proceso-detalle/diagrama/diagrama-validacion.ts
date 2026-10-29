import type { TipoNodo } from '../../../models/diagrama.model';
import type { ProcesoDetalle } from '../../../models/proceso.model';

/**
 * Revisión de coherencia del modelo (el sistema "valida y advierte", no ejecuta).
 * Devuelve advertencias legibles; no impide guardar: un borrador puede estar incompleto (HU-04).
 */
export function validarDiagrama(detalle: ProcesoDetalle): string[] {
  const advertencias: string[] = [];

  const entradas = new Map<string, number>();
  const salidas = new Map<string, number>();
  for (const arco of detalle.arcos) {
    sumar(salidas, clave(arco.tipoOrigen, arco.origenId));
    sumar(entradas, clave(arco.tipoDestino, arco.destinoId));
  }
  const totalNodos = detalle.actividades.length + detalle.gateways.length + detalle.eventosMensaje.length;

  // Pools y lanes (HU-21, HU-22)
  for (const pool of detalle.pools) {
    const tieneLanes = detalle.lanes.some(lane => lane.poolId === pool.id);
    if (pool.tipo === 'PROPIO' && !tieneLanes) {
      advertencias.push(`El pool "${pool.nombre}" no tiene lanes: agregue al menos una para ubicar actividades.`);
    }
  }

  // Actividades desconectadas (HU-10, HU-13)
  if (totalNodos > 1) {
    for (const actividad of detalle.actividades) {
      const k = clave('ACTIVIDAD', actividad.id);
      if (!entradas.get(k) && !salidas.get(k)) {
        advertencias.push(`La actividad "${actividad.nombre}" no está conectada a ningún arco.`);
      }
    }
  }

  // Gateways (HU-14, HU-15)
  for (const gateway of detalle.gateways) {
    const k = clave('GATEWAY', gateway.id);
    const salientes = detalle.arcos.filter(a => a.tipoOrigen === 'GATEWAY' && a.origenId === gateway.id);
    const nombre = `El gateway ${gateway.tipo.toLowerCase()} #${gateway.id}`;

    if (!entradas.get(k)) {
      advertencias.push(`${nombre} no tiene camino de entrada.`);
    }
    if (salientes.length < 2 && (entradas.get(k) ?? 0) < 2) {
      advertencias.push(`${nombre} debería tener al menos dos caminos de salida (o de entrada si une ramas).`);
    }
    if (gateway.tipo !== 'PARALELO' && salientes.some(a => !a.condicion?.trim())) {
      advertencias.push(`${nombre} tiene arcos de salida sin condición.`);
    }
  }

  // Mensajes (HU-25 a HU-28)
  for (const evento of detalle.eventosMensaje) {
    const envia = detalle.flujosMensaje.some(f => f.origenId === evento.id);
    const recibe = detalle.flujosMensaje.some(f => f.destinoId === evento.id);

    if (evento.tipo === 'THROW' && !envia) {
      advertencias.push(`El Message Throw "${evento.nombreMensaje}" no envía su mensaje a ningún participante.`);
    }
    if (evento.tipo !== 'THROW' && !recibe && !evento.origenExterno) {
      advertencias.push(`El Message Catch "${evento.nombreMensaje}" no recibe ningún flujo de mensaje.`);
    }
    if (evento.tipo === 'CATCH_INTERMEDIO' && !evento.claveCorrelacion) {
      advertencias.push(`El Message Catch "${evento.nombreMensaje}" no define clave de correlación.`);
    }
  }

  return advertencias;
}

function clave(tipo: TipoNodo, id: number): string {
  return `${tipo}-${id}`;
}

function sumar(mapa: Map<string, number>, k: string): void {
  mapa.set(k, (mapa.get(k) ?? 0) + 1);
}
