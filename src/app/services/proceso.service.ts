import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { Pagina } from '../models/api.model';
import type {
  EstadoProceso,
  HistorialProceso,
  ProcesoCrearRequest,
  ProcesoDetalle,
  ProcesoEditarRequest,
  ProcesoListItem,
  ProcesoResponse
} from '../models/proceso.model';

export interface FiltrosProceso {
  nombre?: string;
  estado?: EstadoProceso;
  categoria?: string;
  incluirInactivos?: boolean;
  page?: number;
  size?: number;
}

/** HU-04 a HU-07: procesos de la empresa. */
@Injectable({ providedIn: 'root' })
export class ProcesoService {

  private readonly http = inject(HttpClient);
  private readonly url = '/api/procesos';

  listar(filtros: FiltrosProceso = {}): Observable<Pagina<ProcesoListItem>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 10)
      .set('incluirInactivos', filtros.incluirInactivos ?? false);

    // Solo se envían los filtros con valor
    if (filtros.nombre?.trim()) {
      params = params.set('nombre', filtros.nombre.trim());
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.categoria?.trim()) {
      params = params.set('categoria', filtros.categoria.trim());
    }

    return this.http.get<Pagina<ProcesoListItem>>(this.url, { params });
  }

  /** Datos del proceso y su diagrama completo. */
  obtener(id: number): Observable<ProcesoDetalle> {
    return this.http.get<ProcesoDetalle>(`${this.url}/${id}`);
  }

  historial(id: number): Observable<HistorialProceso[]> {
    return this.http.get<HistorialProceso[]>(`${this.url}/${id}/historial`);
  }

  crear(datos: ProcesoCrearRequest): Observable<ProcesoResponse> {
    return this.http.post<ProcesoResponse>(this.url, datos);
  }

  editar(id: number, datos: ProcesoEditarRequest): Observable<ProcesoResponse> {
    return this.http.put<ProcesoResponse>(`${this.url}/${id}`, datos);
  }

  /** El servidor marca el proceso como inactivo y conserva su historial. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { params: { confirmar: true } });
  }
}
