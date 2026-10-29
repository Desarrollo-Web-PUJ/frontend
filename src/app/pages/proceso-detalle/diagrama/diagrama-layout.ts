import type {
  Actividad,
  EventoMensaje,
  Gateway,
  Lane,
  Pool,
  TipoNodo
} from '../../../models/diagrama.model';
import type { ProcesoDetalle } from '../../../models/proceso.model';

/**
 * Cálculo de la geometría del diagrama (funciones puras, sin Angular).
 *
 * Convención de coordenadas guardadas en el backend:
 *  - posicionX: distancia horizontal desde el inicio del área de contenido.
 *  - posicionY: centro vertical del elemento medido desde el borde superior
 *    de su pool. Las actividades no la usan: su lane define la altura.
 */
export const DIMENSIONES = {
  margen: 16,
  anchoEtiquetaPool: 32,
  anchoEtiquetaLane: 32,
  altoLane: 130,
  altoPoolSinLanes: 120,
  altoPoolExterno: 64,
  separacionPools: 72,
  anchoActividad: 136,
  altoActividad: 60,
  ladoGateway: 48,
  diametroEvento: 40,
  inicioAutomatico: 36,
  pasoAutomatico: 180,
  anchoMinimo: 960,
  margenDerecho: 160
} as const;

/** Inicio horizontal del área donde se dibujan los elementos (después de las etiquetas). */
export const ORIGEN_X = DIMENSIONES.margen + DIMENSIONES.anchoEtiquetaPool + DIMENSIONES.anchoEtiquetaLane;

export interface Caja {
  clave: string;
  tipo: TipoNodo;
  id: number;
  poolId: number;
  laneId: number | null;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface BandaLane {
  lane: Lane;
  y: number;
  alto: number;
}

export interface BandaPool {
  pool: Pool;
  y: number;
  alto: number;
  lanes: BandaLane[];
}

export interface Trazo {
  id: number;
  d: string;
  texto: string | null;
  textoX: number;
  textoY: number;
}

export interface TrazoMensaje extends Trazo {
  correlacion: string | null;
}

export interface NodoActividad { caja: Caja; actividad: Actividad; }
export interface NodoGateway { caja: Caja; gateway: Gateway; }
export interface NodoEvento { caja: Caja; evento: EventoMensaje; }

export interface LayoutDiagrama {
  ancho: number;
  alto: number;
  pools: BandaPool[];
  actividades: NodoActividad[];
  gateways: NodoGateway[];
  eventos: NodoEvento[];
  arcos: Trazo[];
  mensajes: TrazoMensaje[];
}

/** Desplazamiento temporal de un nodo mientras el usuario lo arrastra. */
export interface Desplazamiento {
  clave: string;
  dx: number;
  dy: number;
}

export function claveNodo(tipo: TipoNodo, id: number): string {
  return `${tipo}-${id}`;
}

export function calcularLayout(detalle: ProcesoDetalle, desplazamiento: Desplazamiento | null = null): LayoutDiagrama {
  const pools = ordenarPools(detalle.pools);
  const lanesPorPool = agruparLanes(detalle.lanes);
  const xAutomaticas = asignarXAutomaticas(detalle);

  const anchoContenido = calcularAnchoContenido(detalle, xAutomaticas);
  const ancho = ORIGEN_X + anchoContenido + DIMENSIONES.margen;

  // Pools apilados verticalmente; sus lanes dividen la altura en bandas
  const bandas: BandaPool[] = [];
  let y = DIMENSIONES.margen;
  for (const pool of pools) {
    const lanes = pool.tipo === 'EXTERNO' ? [] : (lanesPorPool.get(pool.id) ?? []);
    const alto = pool.tipo === 'EXTERNO'
      ? DIMENSIONES.altoPoolExterno
      : lanes.length ? lanes.length * DIMENSIONES.altoLane : DIMENSIONES.altoPoolSinLanes;

    bandas.push({
      pool,
      y,
      alto,
      lanes: lanes.map((lane, i) => ({ lane, y: y + i * DIMENSIONES.altoLane, alto: DIMENSIONES.altoLane }))
    });
    y += alto + DIMENSIONES.separacionPools;
  }
  const alto = Math.max(y - DIMENSIONES.separacionPools + DIMENSIONES.margen, 160);

  const bandaDePool = new Map(bandas.map(banda => [banda.pool.id, banda]));
  const bandaDeLane = new Map(bandas.flatMap(banda => banda.lanes.map(l => [l.lane.id, { banda, lane: l }] as const)));
  const poolPorDefecto = bandas.find(b => b.pool.tipo === 'PROPIO') ?? bandas[0];

  const posicionX = (tipo: TipoNodo, id: number, valor: number | null) =>
    ORIGEN_X + (valor ?? xAutomaticas.get(claveNodo(tipo, id)) ?? DIMENSIONES.inicioAutomatico);

  const actividades: NodoActividad[] = [];
  for (const actividad of detalle.actividades) {
    const ubicacion = bandaDeLane.get(actividad.laneId);
    if (!ubicacion) continue;
    actividades.push({
      actividad,
      caja: {
        clave: claveNodo('ACTIVIDAD', actividad.id),
        tipo: 'ACTIVIDAD',
        id: actividad.id,
        poolId: ubicacion.banda.pool.id,
        laneId: actividad.laneId,
        x: posicionX('ACTIVIDAD', actividad.id, actividad.posicionX),
        y: ubicacion.lane.y + (ubicacion.lane.alto - DIMENSIONES.altoActividad) / 2,
        ancho: DIMENSIONES.anchoActividad,
        alto: DIMENSIONES.altoActividad
      }
    });
  }

  const gateways: NodoGateway[] = [];
  for (const gateway of detalle.gateways) {
    const banda = (gateway.poolId != null ? bandaDePool.get(gateway.poolId) : undefined) ?? poolPorDefecto;
    if (!banda) continue;
    const lado = DIMENSIONES.ladoGateway;
    const centroY = centroEnPool(banda, gateway.posicionY, lado);
    gateways.push({
      gateway,
      caja: {
        clave: claveNodo('GATEWAY', gateway.id),
        tipo: 'GATEWAY',
        id: gateway.id,
        poolId: banda.pool.id,
        laneId: null,
        x: posicionX('GATEWAY', gateway.id, gateway.posicionX),
        y: centroY - lado / 2,
        ancho: lado,
        alto: lado
      }
    });
  }

  const eventos: NodoEvento[] = [];
  for (const evento of detalle.eventosMensaje) {
    const banda = bandaDePool.get(evento.poolId);
    if (!banda) continue;
    const diametro = DIMENSIONES.diametroEvento;
    const lane = evento.laneId != null ? bandaDeLane.get(evento.laneId)?.lane : undefined;
    const centroY = lane ? lane.y + lane.alto / 2 : centroEnPool(banda, evento.posicionY, diametro);
    eventos.push({
      evento,
      caja: {
        clave: claveNodo('EVENTO', evento.id),
        tipo: 'EVENTO',
        id: evento.id,
        poolId: banda.pool.id,
        laneId: evento.laneId,
        x: posicionX('EVENTO', evento.id, evento.posicionX),
        y: centroY - diametro / 2,
        ancho: diametro,
        alto: diametro
      }
    });
  }

  const cajas = new Map<string, Caja>(
    [...actividades, ...gateways, ...eventos].map(nodo => [nodo.caja.clave, nodo.caja])
  );
  aplicarDesplazamiento(cajas, desplazamiento);

  return {
    ancho,
    alto,
    pools: bandas,
    actividades,
    gateways,
    eventos,
    arcos: trazarArcos(detalle, cajas),
    mensajes: trazarMensajes(detalle, cajas, bandaDePool)
  };
}

/** Siguiente posición horizontal libre de un pool, para ubicar un elemento nuevo. */
export function siguientePosicionX(detalle: ProcesoDetalle, poolId: number | null): number {
  const lanesDelPool = new Set(detalle.lanes.filter(l => l.poolId === poolId).map(l => l.id));
  const finales = [
    ...detalle.actividades
      .filter(a => lanesDelPool.has(a.laneId))
      .map(a => (a.posicionX ?? 0) + DIMENSIONES.anchoActividad),
    ...detalle.gateways
      .filter(g => g.poolId === poolId)
      .map(g => (g.posicionX ?? 0) + DIMENSIONES.ladoGateway),
    ...detalle.eventosMensaje
      .filter(e => e.poolId === poolId)
      .map(e => (e.posicionX ?? 0) + DIMENSIONES.diametroEvento)
  ];
  return finales.length ? Math.max(...finales) + 44 : DIMENSIONES.inicioAutomatico;
}

/** Divide un texto en líneas cortas para que quepa dentro de una actividad. */
export function partirTexto(texto: string, maxCaracteres = 18, maxLineas = 3): string[] {
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length <= maxCaracteres || !actual) {
      actual = candidata;
    } else {
      lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);

  if (lineas.length <= maxLineas) return lineas;
  const recortadas = lineas.slice(0, maxLineas);
  recortadas[maxLineas - 1] = `${recortadas[maxLineas - 1].slice(0, maxCaracteres - 1)}…`;
  return recortadas;
}

// ---------------------------------------------------------------------------

function ordenarPools(pools: Pool[]): Pool[] {
  // El pool de la empresa propietaria primero; luego los demás en orden de creación
  return [...pools].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === 'PROPIO' ? -1 : 1;
    return a.id - b.id;
  });
}

function agruparLanes(lanes: Lane[]): Map<number, Lane[]> {
  const grupos = new Map<number, Lane[]>();
  for (const lane of lanes) {
    if (lane.poolId == null) continue;
    const grupo = grupos.get(lane.poolId) ?? [];
    grupo.push(lane);
    grupos.set(lane.poolId, grupo);
  }
  for (const grupo of grupos.values()) {
    grupo.sort((a, b) => a.orden - b.orden || a.id - b.id);
  }
  return grupos;
}

/** Elementos antiguos sin posición: se ubican uno tras otro dentro de su pool. */
function asignarXAutomaticas(detalle: ProcesoDetalle): Map<string, number> {
  const poolDeLane = new Map(detalle.lanes.map(l => [l.id, l.poolId]));
  const sinPosicion: { clave: string; poolId: number | null; id: number }[] = [
    ...detalle.actividades
      .filter(a => a.posicionX == null)
      .map(a => ({ clave: claveNodo('ACTIVIDAD', a.id), poolId: poolDeLane.get(a.laneId) ?? null, id: a.id })),
    ...detalle.eventosMensaje
      .filter(e => e.posicionX == null)
      .map(e => ({ clave: claveNodo('EVENTO', e.id), poolId: e.poolId, id: e.id })),
    ...detalle.gateways
      .filter(g => g.posicionX == null)
      .map(g => ({ clave: claveNodo('GATEWAY', g.id), poolId: g.poolId, id: g.id }))
  ];

  const indicePorPool = new Map<number | null, number>();
  const resultado = new Map<string, number>();
  for (const nodo of sinPosicion) {
    const indice = indicePorPool.get(nodo.poolId) ?? 0;
    resultado.set(nodo.clave, DIMENSIONES.inicioAutomatico + indice * DIMENSIONES.pasoAutomatico);
    indicePorPool.set(nodo.poolId, indice + 1);
  }
  return resultado;
}

function calcularAnchoContenido(detalle: ProcesoDetalle, xAutomaticas: Map<string, number>): number {
  const finales = [
    ...detalle.actividades.map(a =>
      (a.posicionX ?? xAutomaticas.get(claveNodo('ACTIVIDAD', a.id)) ?? 0) + DIMENSIONES.anchoActividad),
    ...detalle.gateways.map(g =>
      (g.posicionX ?? xAutomaticas.get(claveNodo('GATEWAY', g.id)) ?? 0) + DIMENSIONES.ladoGateway),
    ...detalle.eventosMensaje.map(e =>
      (e.posicionX ?? xAutomaticas.get(claveNodo('EVENTO', e.id)) ?? 0) + DIMENSIONES.diametroEvento)
  ];
  const masLejano = finales.length ? Math.max(...finales) : 0;
  return Math.max(DIMENSIONES.anchoMinimo - ORIGEN_X, masLejano + DIMENSIONES.margenDerecho);
}

function centroEnPool(banda: BandaPool, posicionY: number | null, tamano: number): number {
  const minimo = tamano / 2 + 6;
  const maximo = banda.alto - tamano / 2 - 6;
  const relativo = posicionY ?? banda.alto / 2;
  return banda.y + Math.min(Math.max(relativo, minimo), Math.max(minimo, maximo));
}

function aplicarDesplazamiento(cajas: Map<string, Caja>, desplazamiento: Desplazamiento | null): void {
  if (!desplazamiento) return;
  const caja = cajas.get(desplazamiento.clave);
  if (!caja) return;
  caja.x = Math.max(ORIGEN_X, caja.x + desplazamiento.dx);
  caja.y = caja.y + desplazamiento.dy;
}

function centro(caja: Caja): { x: number; y: number } {
  return { x: caja.x + caja.ancho / 2, y: caja.y + caja.alto / 2 };
}

/** Flujos de secuencia: líneas ortogonales del borde derecho del origen al izquierdo del destino. */
function trazarArcos(detalle: ProcesoDetalle, cajas: Map<string, Caja>): Trazo[] {
  const trazos: Trazo[] = [];
  for (const arco of detalle.arcos) {
    const origen = cajas.get(claveNodo(arco.tipoOrigen, arco.origenId));
    const destino = cajas.get(claveNodo(arco.tipoDestino, arco.destinoId));
    if (!origen || !destino) continue;

    const x1 = origen.x + origen.ancho;
    const y1 = centro(origen).y;
    const x2 = destino.x;
    const y2 = centro(destino).y;
    const texto = arco.condicion ?? arco.etiqueta;

    if (x2 >= x1 + 24) {
      const xMedio = Math.round((x1 + x2) / 2);
      // La etiqueta va junto a la salida del origen, donde se lee qué camino toma el flujo
      const textoY = y2 === y1 ? y1 - 8 : y2 > y1 ? y1 + 16 : y1 - 8;
      trazos.push({
        id: arco.id,
        d: `M ${x1} ${y1} H ${xMedio} V ${y2} H ${x2}`,
        texto,
        textoX: xMedio + 6,
        textoY
      });
    } else {
      // El destino está a la izquierda: se rodea por debajo de ambos elementos
      const yBajo = Math.max(origen.y + origen.alto, destino.y + destino.alto) + 22;
      trazos.push({
        id: arco.id,
        d: `M ${x1} ${y1} H ${x1 + 16} V ${yBajo} H ${x2 - 16} V ${y2} H ${x2}`,
        texto,
        textoX: Math.round((x1 + x2) / 2),
        textoY: yBajo - 6
      });
    }
  }
  return trazos;
}

/** Flujos de mensaje: líneas punteadas que cruzan de un pool a otro. */
function trazarMensajes(
  detalle: ProcesoDetalle,
  cajas: Map<string, Caja>,
  bandaDePool: Map<number, BandaPool>
): TrazoMensaje[] {
  const eventos = new Map(detalle.eventosMensaje.map(e => [e.id, e]));
  const trazos: TrazoMensaje[] = [];

  for (const flujo of detalle.flujosMensaje) {
    const origen = cajas.get(claveNodo('EVENTO', flujo.origenId));
    if (!origen) continue;
    const salida = centro(origen);

    let destinoX: number;
    let destinoArriba: number;
    let destinoAbajo: number;

    if (flujo.destinoId != null) {
      const destino = cajas.get(claveNodo('EVENTO', flujo.destinoId));
      if (!destino) continue;
      destinoX = centro(destino).x;
      destinoArriba = destino.y;
      destinoAbajo = destino.y + destino.alto;
    } else if (flujo.poolDestinoId != null) {
      const banda = bandaDePool.get(flujo.poolDestinoId);
      if (!banda) continue;
      destinoX = Math.max(ORIGEN_X + 20, salida.x);
      destinoArriba = banda.y;
      destinoAbajo = banda.y + banda.alto;
    } else {
      continue;
    }

    const haciaAbajo = destinoArriba >= origen.y + origen.alto;
    const y1 = haciaAbajo ? origen.y + origen.alto : origen.y;
    const y2 = haciaAbajo ? destinoArriba : destinoAbajo;
    const yMedio = Math.round((y1 + y2) / 2);

    const emisor = eventos.get(flujo.origenId);
    trazos.push({
      id: flujo.id,
      d: `M ${salida.x} ${y1} V ${yMedio} H ${destinoX} V ${y2}`,
      texto: flujo.etiqueta ?? emisor?.nombreMensaje ?? null,
      correlacion: emisor?.claveCorrelacion ?? null,
      textoX: Math.max(salida.x, destinoX) + 8,
      textoY: yMedio - 4
    });
  }
  return trazos;
}
