import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { EmpresaRegistroRequest, EmpresaResponse } from '../models/empresa.model';

/** HU-01: registro de la empresa y de su administrador inicial. */
@Injectable({ providedIn: 'root' })
export class EmpresaService {

  private readonly http = inject(HttpClient);

  registrar(datos: EmpresaRegistroRequest): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>('/api/empresas/registro', datos);
  }
}
