import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { ProcesoCompartido } from '../models/proceso.model';

/** HU-23: compartir procesos con otras empresas, siempre en solo lectura. */
@Injectable({ providedIn: 'root' })
export class ComparticionService {

  private readonly http = inject(HttpClient);
  private readonly url = '/api/procesos';

  compartidosConmigo(): Observable<ProcesoCompartido[]> {
    return this.http.get<ProcesoCompartido[]>(`${this.url}/compartidos-conmigo`);
  }

  listar(procesoId: number): Observable<ProcesoCompartido[]> {
    return this.http.get<ProcesoCompartido[]>(`${this.url}/${procesoId}/comparticiones`);
  }

  compartir(procesoId: number, empresaDestinoId: number): Observable<ProcesoCompartido> {
    return this.http.post<ProcesoCompartido>(`${this.url}/${procesoId}/comparticiones`, { empresaDestinoId });
  }

  dejarDeCompartir(procesoId: number, empresaDestinoId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${procesoId}/comparticiones/${empresaDestinoId}`);
  }
}
