// Elementos que componen el diagrama de un proceso (HU-08 a HU-28)

export type TipoPool = 'PROPIO' | 'EXTERNO';

export type TipoActividad =
  | 'TAREA_USUARIO'
  | 'TAREA_SERVICIO'
  | 'TAREA_MANUAL'
  | 'TAREA_SCRIPT'
  | 'TAREA_REGLA_NEGOCIO'
  | 'SUBPROCESO';

export type TipoGateway = 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO';

export type TipoNodo = 'ACTIVIDAD' | 'GATEWAY' | 'EVENTO';

export type TipoEventoMensaje = 'THROW' | 'CATCH_INICIO' | 'CATCH_INTERMEDIO';

export type ComportamientoSinCorrelacion = 'DESCARTAR' | 'INICIAR_NUEVO';

export type TipoDestinoExterno = 'CORREO' | 'SERVICIO_WEB' | 'COLA';

export type ComportamientoFallo = 'CONTINUAR' | 'MANEJAR_ERROR' | 'FINALIZAR';

export interface Pool {
  id: number;
  nombre: string;
  tipo: TipoPool;
  procesoId: number;
  cantidadLanes: number;
}

export interface Lane {
  id: number;
  nombre: string;
  procesoId: number;
  poolId: number | null;
  rolProcesoId: number | null;
  orden: number;
}

export interface Actividad {
  id: number;
  nombre: string;
  tipo: TipoActividad;
  procesoId: number;
  laneId: number;
  laneNombre: string;
  poolId: number | null;
  posicionX: number | null;
  posicionY: number | null;
}

export interface Gateway {
  id: number;
  procesoId: number;
  poolId: number | null;
  tipo: TipoGateway;
  posicionX: number | null;
  posicionY: number | null;
}

export interface Arco {
  id: number;
  procesoId: number;
  tipoOrigen: TipoNodo;
  origenId: number;
  tipoDestino: TipoNodo;
  destinoId: number;
  etiqueta: string | null;
  condicion: string | null;
}

export interface CampoMensaje {
  nombre: string;
  tipoDato: string;
}

export interface EventoMensaje {
  id: number;
  procesoId: number;
  poolId: number;
  poolNombre: string;
  laneId: number | null;
  laneNombre: string | null;
  tipo: TipoEventoMensaje;
  nombreMensaje: string;
  claveCorrelacion: string | null;
  correlacionDefinida: boolean;
  comportamientoSinCorrelacion: ComportamientoSinCorrelacion | null;
  origenExterno: boolean;
  tipoDestinoExterno: TipoDestinoExterno | null;
  comportamientoFallo: ComportamientoFallo | null;
  campos: CampoMensaje[];
  actividadesConsumidoras: number[];
  posicionX: number | null;
  posicionY: number | null;
  advertencias?: string[];
}

export interface FlujoMensaje {
  id: number;
  procesoId: number;
  origenId: number;
  destinoId: number | null;
  poolDestinoId: number | null;
  etiqueta: string | null;
  advertencias?: string[];
}

// ---------- Peticiones ----------

export interface PoolRequest {
  nombre: string;
  tipo: TipoPool;
}

export interface LaneRequest {
  rolProcesoId: number;
  orden?: number | null;
}

export interface ActividadRequest {
  nombre: string;
  tipo: TipoActividad;
  laneId: number;
  posicionX: number | null;
  posicionY: number | null;
}

export interface GatewayRequest {
  tipo: TipoGateway;
  poolId: number;
  posicionX: number | null;
  posicionY: number | null;
}

export interface ArcoRequest {
  tipoOrigen: TipoNodo;
  origenId: number;
  tipoDestino: TipoNodo;
  destinoId: number;
  etiqueta: string | null;
  condicion: string | null;
}

export interface EventoMensajeRequest {
  tipo: TipoEventoMensaje;
  poolId: number;
  laneId: number | null;
  nombreMensaje: string;
  claveCorrelacion: string | null;
  comportamientoSinCorrelacion: ComportamientoSinCorrelacion | null;
  origenExterno: boolean;
  tipoDestinoExterno: TipoDestinoExterno | null;
  comportamientoFallo: ComportamientoFallo | null;
  campos: CampoMensaje[];
  actividadesConsumidoras: number[];
  posicionX: number | null;
  posicionY: number | null;
}

export interface FlujoMensajeRequest {
  origenId: number;
  destinoId: number | null;
  poolDestinoId: number | null;
  etiqueta: string | null;
}

// ---------- Respuestas con advertencias ----------

export interface EdicionGatewayResponse {
  gateway: Gateway;
  advertencias: string[];
}

export interface EliminacionGatewayResponse {
  gatewayId: number;
  arcosEliminados: number;
  advertencias: string[];
}

// ---------- Etiquetas legibles para la interfaz ----------

export const TIPOS_ACTIVIDAD: Record<TipoActividad, string> = {
  TAREA_USUARIO: 'Tarea de usuario',
  TAREA_SERVICIO: 'Tarea de servicio',
  TAREA_MANUAL: 'Tarea manual',
  TAREA_SCRIPT: 'Tarea de script',
  TAREA_REGLA_NEGOCIO: 'Regla de negocio',
  SUBPROCESO: 'Subproceso'
};

export const TIPOS_GATEWAY: Record<TipoGateway, string> = {
  EXCLUSIVO: 'Exclusivo (un solo camino)',
  PARALELO: 'Paralelo (todos los caminos)',
  INCLUSIVO: 'Inclusivo (uno o varios caminos)'
};

export const TIPOS_EVENTO: Record<TipoEventoMensaje, string> = {
  THROW: 'Message Throw (envía)',
  CATCH_INICIO: 'Message Catch de inicio (arranca el proceso)',
  CATCH_INTERMEDIO: 'Message Catch intermedio (espera un mensaje)'
};

export const TIPOS_DESTINO_EXTERNO: Record<TipoDestinoExterno, string> = {
  CORREO: 'Correo electrónico',
  SERVICIO_WEB: 'Servicio web',
  COLA: 'Cola de mensajes'
};

export const COMPORTAMIENTOS_FALLO: Record<ComportamientoFallo, string> = {
  CONTINUAR: 'Continuar el flujo',
  MANEJAR_ERROR: 'Manejar el error',
  FINALIZAR: 'Finalizar el proceso'
};

export const COMPORTAMIENTOS_SIN_CORRELACION: Record<ComportamientoSinCorrelacion, string> = {
  DESCARTAR: 'Descartar el mensaje',
  INICIAR_NUEVO: 'Iniciar un caso nuevo'
};
