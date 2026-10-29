import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { ResultadoEliminacion } from '../models/api.model';
import type { Actividad, ActividadRequest } from '../models/diagrama.model';

/** HU-08 a HU-10: actividades del proceso. */
@Injectable({ providedIn: 'root' })
export class ActividadService {

  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/api/procesos/${procesoId}/actividades`;
  }

  crear(procesoId: number, datos: ActividadRequest): Observable<Actividad> {
    return this.http.post<Actividad>(this.url(procesoId), datos);
  }

  editar(procesoId: number, actividadId: number, datos: ActividadRequest): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.url(procesoId)}/${actividadId}`, datos);
  }

  eliminar(procesoId: number, actividadId: number): Observable<ResultadoEliminacion> {
    return this.http.delete<ResultadoEliminacion>(`${this.url(procesoId)}/${actividadId}`, {
      params: { confirmar: true }
    });
  }
}
