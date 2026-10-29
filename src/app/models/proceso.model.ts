import type {
  Actividad,
  Arco,
  EventoMensaje,
  FlujoMensaje,
  Gateway,
  Lane,
  Pool
} from './diagrama.model';

export type EstadoProceso =
  | 'BORRADOR'
  | 'PUBLICADO';

export interface ProcesoResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  estado: EstadoProceso;
  activo: boolean;
  empresaId: number;
}

export interface ProcesoListItem {
  id: number;
  nombre: string;
  categoria: string;
  estado: EstadoProceso;
  activo: boolean;
}

// Crear siempre genera un borrador; el estado se cambia al editar.
export interface ProcesoCrearRequest {
  nombre: string;
  descripcion: string;
  categoria: string;
}

export interface ProcesoEditarRequest extends ProcesoCrearRequest {
  estado: EstadoProceso;
}

/** Proceso con su diagrama completo (HU-07). */
export interface ProcesoDetalle {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  estado: EstadoProceso;
  activo: boolean;
  empresaId: number;
  pools: Pool[];
  lanes: Lane[];
  actividades: Actividad[];
  gateways: Gateway[];
  arcos: Arco[];
  eventosMensaje: EventoMensaje[];
  flujosMensaje: FlujoMensaje[];
}

export interface HistorialProceso {
  id: number;
  descripcion: string;
  usuario: string | null;
  fecha: string;
}

/** Empresa con la que se comparte un proceso, o proceso compartido conmigo (HU-23). */
export interface ProcesoCompartido {
  procesoId: number;
  procesoNombre: string;
  empresaDestinoId: number;
  empresaDestinoNombre: string;
  fechaCompartido: string;
}
