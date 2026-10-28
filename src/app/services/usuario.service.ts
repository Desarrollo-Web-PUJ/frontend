import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { RolUsuario } from '../models/auth.model';
import type { UsuarioRegistroRequest, UsuarioResponse } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);

  // La empresa proviene de la sesión, no de un campo editable del formulario.
  private url(empresaId: number): string {
    return `/api/empresas/${empresaId}/usuarios`;
  }

  listar(empresaId: number) {
    return this.http.get<UsuarioResponse[]>(this.url(empresaId), { withCredentials: true });
  }

  registrar(empresaId: number, datos: UsuarioRegistroRequest) {
    return this.http.post<UsuarioResponse>(`${this.url(empresaId)}/registro`, datos, { withCredentials: true });
  }

  cambiarRol(empresaId: number, usuarioId: number, rol: RolUsuario) {
    return this.http.put<UsuarioResponse>(`${this.url(empresaId)}/${usuarioId}/rol`, { rol }, { withCredentials: true });
  }

  desactivar(empresaId: number, usuarioId: number) {
    return this.http.patch<UsuarioResponse>(`${this.url(empresaId)}/${usuarioId}/desactivar`, {}, { withCredentials: true });
  }
}
