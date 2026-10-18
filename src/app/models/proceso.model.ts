
export type EstadoProceso =
  | 'BORRADOR'
  | 'PUBLICADO';

export interface ProcesoResponse {
  id: number;
  nombre: string;
  descripcion: string;
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

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

