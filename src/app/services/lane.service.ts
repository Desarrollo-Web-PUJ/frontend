import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { ResultadoEliminacion } from '../models/api.model';
import type { Lane, LaneRequest } from '../models/diagrama.model';

/** HU-22: lanes (swimlanes) de un pool. */
@Injectable({ providedIn: 'root' })
export class LaneService {

  private readonly http = inject(HttpClient);

  private url(procesoId: number, poolId: number): string {
    return `/api/procesos/${procesoId}/pools/${poolId}/lanes`;
  }

  crear(procesoId: number, poolId: number, datos: LaneRequest): Observable<Lane> {
    return this.http.post<Lane>(this.url(procesoId, poolId), datos);
  }

  editar(procesoId: number, poolId: number, laneId: number, datos: LaneRequest): Observable<Lane> {
    return this.http.put<Lane>(`${this.url(procesoId, poolId)}/${laneId}`, datos);
  }

  reordenar(procesoId: number, poolId: number, laneIdsEnOrden: number[]): Observable<Lane[]> {
    return this.http.put<Lane[]>(`${this.url(procesoId, poolId)}/orden`, { laneIdsEnOrden });
  }

  eliminar(procesoId: number, poolId: number, laneId: number): Observable<ResultadoEliminacion> {
    return this.http.delete<ResultadoEliminacion>(`${this.url(procesoId, poolId)}/${laneId}`, {
      params: { confirmar: true }
    });
  }
}
