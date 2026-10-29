import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { ResultadoEliminacion } from '../models/api.model';
import type { FlujoMensaje, FlujoMensajeRequest } from '../models/diagrama.model';

/** HU-25 y HU-26: flujos de mensaje entre pools y hacia sistemas externos. */
@Injectable({ providedIn: 'root' })
export class FlujoMensajeService {

  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/api/procesos/${procesoId}/flujos-mensaje`;
  }

  crear(procesoId: number, datos: FlujoMensajeRequest): Observable<FlujoMensaje> {
    return this.http.post<FlujoMensaje>(this.url(procesoId), datos);
  }

  editar(procesoId: number, flujoId: number, datos: FlujoMensajeRequest): Observable<FlujoMensaje> {
    return this.http.put<FlujoMensaje>(`${this.url(procesoId)}/${flujoId}`, datos);
  }

  eliminar(procesoId: number, flujoId: number): Observable<ResultadoEliminacion> {
    return this.http.delete<ResultadoEliminacion>(`${this.url(procesoId)}/${flujoId}`, {
      params: { confirmar: true }
    });
  }
}
