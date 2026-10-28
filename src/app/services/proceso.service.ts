
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import type {
  ProcesoCrearRequest, ProcesoEditarRequest, ProcesoResponse, ProcesoDetalle,
  EstadoProceso,
  Page,
  ProcesoListItem
} from '../models/proceso.model';

export interface FiltrosProceso {
  nombre?: string;
  estado?: EstadoProceso;
  categoria?: string;
  incluirInactivos?: boolean;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProcesoService {

  private readonly http = inject(HttpClient);

  private readonly url = '/api/procesos';

  listar(
    filtros: FiltrosProceso = {}
  ): Observable<Page<ProcesoListItem>> {

    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 10)
      .set('incluirInactivos', filtros.incluirInactivos ?? false);

    if (filtros.nombre?.trim()) {
      params = params.set('nombre', filtros.nombre.trim());
    }

    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    if (filtros.categoria?.trim()) {
      params = params.set('categoria', filtros.categoria.trim());
    }

    return this.http.get<Page<ProcesoListItem>>(
      this.url,
      {
        params,
        withCredentials: true
      }
    );
  }

  obtener(id: number): Observable<ProcesoDetalle> {
    return this.http.get<ProcesoDetalle>(`${this.url}/${id}`, { withCredentials: true });
  }

  crear(datos: ProcesoCrearRequest): Observable<ProcesoResponse> {
    return this.http.post<ProcesoResponse>(this.url, datos, { withCredentials: true });
  }

  editar(id: number, datos: ProcesoEditarRequest): Observable<ProcesoResponse> {
    return this.http.put<ProcesoResponse>(`${this.url}/${id}`, datos, { withCredentials: true });
  }

  eliminar(id: number): Observable<void> {
    // El servidor marca el proceso como inactivo y conserva su historial.
    return this.http.delete<void>(`${this.url}/${id}`, {
      params: { confirmar: true }, withCredentials: true
    });
  }
}

