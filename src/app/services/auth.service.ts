
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  LoginRequest,
  LoginResponse
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly url = '/api/auth';

  // Conservamos solo los datos del usuario; la autenticación sigue en la cookie del servidor.
  readonly usuario = signal<LoginResponse | null>(this.leerSesion());
  readonly esAdministrador = computed(() => this.usuario()?.rol === 'ADMINISTRADOR');
  readonly puedeEditar = computed(() => ['ADMINISTRADOR', 'EDITOR'].includes(this.usuario()?.rol ?? ''));

  private leerSesion(): LoginResponse | null {
    try {
      const usuario = JSON.parse(sessionStorage.getItem('usuarioActual') ?? 'null');
      return usuario && Number.isInteger(usuario.empresaId) && Number.isInteger(usuario.usuarioId)
        && ['ADMINISTRADOR', 'EDITOR', 'LECTURA'].includes(usuario.rol) ? usuario : null;
    } catch {
      return null;
    }
  }

  limpiarSesion(): void {
    this.usuario.set(null);
    sessionStorage.removeItem('usuarioActual');
  }

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.url}/login`,
      datos,
      { withCredentials: true }
    ).pipe(tap(usuario => {
      this.usuario.set(usuario);
      sessionStorage.setItem('usuarioActual', JSON.stringify(usuario));
    }));
  }

  logout(): Observable<string> {
    return this.http.post(
      `${this.url}/logout`,
      {},
      {
        withCredentials: true,
        responseType: 'text'
      }
    ).pipe(tap(() => this.limpiarSesion()));
  }
}



