import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type {
  EdicionGatewayResponse,
  EliminacionGatewayResponse,
  Gateway,
  GatewayRequest
} from '../models/diagrama.model';

/** HU-14 a HU-16: gateways (puntos de decisión) del proceso. */
@Injectable({ providedIn: 'root' })
export class GatewayService {

  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/api/procesos/${procesoId}/gateways`;
  }

  crear(procesoId: number, datos: GatewayRequest): Observable<Gateway> {
    return this.http.post<Gateway>(this.url(procesoId), datos);
  }

  editar(procesoId: number, gatewayId: number, datos: GatewayRequest): Observable<EdicionGatewayResponse> {
    return this.http.put<EdicionGatewayResponse>(`${this.url(procesoId)}/${gatewayId}`, datos);
  }

  eliminar(procesoId: number, gatewayId: number): Observable<EliminacionGatewayResponse> {
    return this.http.delete<EliminacionGatewayResponse>(`${this.url(procesoId)}/${gatewayId}`, {
      params: { confirmar: true }
    });
  }
}
