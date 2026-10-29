import type { TipoNodo } from '../../../models/diagrama.model';

/** Tipos de elemento que el usuario puede seleccionar o crear en el editor. */
export type TipoElemento = 'POOL' | 'LANE' | 'ACTIVIDAD' | 'GATEWAY' | 'EVENTO' | 'ARCO' | 'FLUJO';

export interface Seleccion {
  tipo: TipoElemento;
  id: number;
}

/** Nueva ubicación de un nodo después de arrastrarlo en el diagrama. */
export interface MovimientoNodo {
  tipo: TipoNodo;
  id: number;
  posicionX: number;
  posicionY: number;
  /** Lane sobre la que se soltó el nodo (cambia el responsable de una actividad, HU-09). */
  laneId: number | null;
}

/** Resultado de crear, editar o eliminar un elemento desde un editor. */
export interface ResultadoEdicion {
  mensaje: string;
  advertencias: string[];
}
