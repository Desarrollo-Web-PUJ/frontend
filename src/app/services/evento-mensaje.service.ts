import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { ResultadoEliminacion } from '../models/api.model';
import type { EventoMensaje, EventoMensajeRequest } from '../models/diagrama.model';

/** HU-25 a HU-28: eventos de mensaje (throw / catch) y su correlación. */
@Injectable({ providedIn: 'root' })
export class EventoMensajeService {

  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/api/procesos/${procesoId}/eventos-mensaje`;
  }

  crear(procesoId: number, datos: EventoMensajeRequest): Observable<EventoMensaje> {
    return this.http.post<EventoMensaje>(this.url(procesoId), datos);
  }

  editar(procesoId: number, eventoId: number, datos: EventoMensajeRequest): Observable<EventoMensaje> {
    return this.http.put<EventoMensaje>(`${this.url(procesoId)}/${eventoId}`, datos);
  }

  eliminar(procesoId: number, eventoId: number): Observable<ResultadoEliminacion> {
    return this.http.delete<ResultadoEliminacion>(`${this.url(procesoId)}/${eventoId}`, {
      params: { confirmar: true }
    });
  }
}
