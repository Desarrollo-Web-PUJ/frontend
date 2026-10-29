import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { RolUsuario } from '../models/auth.model';
import type { UsuarioRegistroRequest, UsuarioResponse } from '../models/usuario.model';

/** HU-02: colaboradores de la empresa y sus roles de acceso. */
@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private readonly http = inject(HttpClient);

  // La empresa proviene de la sesión, no de un campo editable del formulario.
  private url(empresaId: number): string {
    return `/api/empresas/${empresaId}/usuarios`;
  }

  listar(empresaId: number): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.url(empresaId));
  }

  registrar(empresaId: number, datos: UsuarioRegistroRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.url(empresaId)}/registro`, datos);
  }

  cambiarRol(empresaId: number, usuarioId: number, rol: RolUsuario): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.url(empresaId)}/${usuarioId}/rol`, { rol });
  }

  desactivar(empresaId: number, usuarioId: number): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${this.url(empresaId)}/${usuarioId}/desactivar`, {});
  }
}
