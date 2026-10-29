import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { Pagina, ResultadoEliminacion } from '../models/api.model';
import type { RolProceso, RolProcesoListItem, RolProcesoRequest } from '../models/rol-proceso.model';

/** HU-17 a HU-20: catálogo de roles de proceso de la empresa. */
@Injectable({ providedIn: 'root' })
export class RolProcesoService {

  private readonly http = inject(HttpClient);
  private readonly url = '/api/roles-proceso';

  consultar(nombre = '', page = 0, size = 10): Observable<Pagina<RolProcesoListItem>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (nombre.trim()) {
      params = params.set('nombre', nombre.trim());
    }
    return this.http.get<Pagina<RolProcesoListItem>>(this.url, { params });
  }

  crear(datos: RolProcesoRequest): Observable<RolProceso> {
    return this.http.post<RolProceso>(this.url, datos);
  }

  editar(id: number, datos: RolProcesoRequest): Observable<RolProceso> {
    return this.http.put<RolProceso>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<Pick<ResultadoEliminacion, 'mensaje'>> {
    return this.http.delete<Pick<ResultadoEliminacion, 'mensaje'>>(`${this.url}/${id}`, {
      params: { confirmar: true }
    });
  }
}
