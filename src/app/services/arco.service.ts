import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { ResultadoEliminacion } from '../models/api.model';
import type { Arco, ArcoRequest } from '../models/diagrama.model';

/** HU-11 a HU-13: arcos (flujos de secuencia) dentro de un pool. */
@Injectable({ providedIn: 'root' })
export class ArcoService {

  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/api/procesos/${procesoId}/arcos`;
  }

  crear(procesoId: number, datos: ArcoRequest): Observable<Arco> {
    return this.http.post<Arco>(this.url(procesoId), datos);
  }

  editar(procesoId: number, arcoId: number, datos: ArcoRequest): Observable<Arco> {
    return this.http.put<Arco>(`${this.url(procesoId)}/${arcoId}`, datos);
  }

  eliminar(procesoId: number, arcoId: number): Observable<ResultadoEliminacion> {
    return this.http.delete<ResultadoEliminacion>(`${this.url(procesoId)}/${arcoId}`, {
      params: { confirmar: true }
    });
  }
}
