import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { ResultadoEliminacion } from '../models/api.model';
import type { Pool, PoolRequest } from '../models/diagrama.model';
import type { RolProceso } from '../models/rol-proceso.model';

/** HU-21 y HU-24: participantes (pools) del proceso. */
@Injectable({ providedIn: 'root' })
export class PoolService {

  private readonly http = inject(HttpClient);

  private url(procesoId: number): string {
    return `/api/procesos/${procesoId}/pools`;
  }

  crear(procesoId: number, datos: PoolRequest): Observable<Pool> {
    return this.http.post<Pool>(this.url(procesoId), datos);
  }

  editar(procesoId: number, poolId: number, datos: PoolRequest): Observable<Pool> {
    return this.http.put<Pool>(`${this.url(procesoId)}/${poolId}`, datos);
  }

  eliminar(procesoId: number, poolId: number): Observable<ResultadoEliminacion> {
    return this.http.delete<ResultadoEliminacion>(`${this.url(procesoId)}/${poolId}`, {
      params: { confirmar: true }
    });
  }

  /** HU-24: únicos roles que pueden nombrar las lanes del pool. */
  rolesDisponibles(procesoId: number, poolId: number): Observable<RolProceso[]> {
    return this.http.get<RolProceso[]>(`${this.url(procesoId)}/${poolId}/roles-disponibles`);
  }
}
