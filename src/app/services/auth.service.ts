import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { LoginRequest, LoginResponse, RolUsuario } from '../models/auth.model';

const CLAVE_ALMACENAMIENTO = 'usuarioActual';
const ROLES_VALIDOS: readonly RolUsuario[] = ['ADMINISTRADOR', 'EDITOR', 'LECTURA'];

/**
 * Estado del usuario autenticado, compartido por toda la aplicación.
 * La autenticación real vive en la cookie de sesión del servidor; aquí solo
 * se guardan los datos que la interfaz necesita para mostrar u ocultar acciones.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly url = '/api/auth';

  readonly usuario = signal<LoginResponse | null>(this.leerSesion());
  readonly esAdministrador = computed(() => this.usuario()?.rol === 'ADMINISTRADOR');
  readonly puedeEditar = computed(() => {
    const rol = this.usuario()?.rol;
    return rol === 'ADMINISTRADOR' || rol === 'EDITOR';
  });

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/login`, datos)
      .pipe(tap(usuario => this.guardarSesion(usuario)));
  }

  /** Consulta al servidor el usuario vigente (rol y empresa actualizados). */
  cargarSesion(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.url}/sesion`)
      .pipe(tap(usuario => this.guardarSesion(usuario)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.url}/logout`, {})
      .pipe(tap(() => this.limpiarSesion()));
  }

  limpiarSesion(): void {
    this.usuario.set(null);
    sessionStorage.removeItem(CLAVE_ALMACENAMIENTO);
  }

  private guardarSesion(usuario: LoginResponse): void {
    this.usuario.set(usuario);
    // Nunca se guarda la contraseña: solo los datos de la respuesta del servidor
    sessionStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(usuario));
  }

  private leerSesion(): LoginResponse | null {
    try {
      const usuario = JSON.parse(sessionStorage.getItem(CLAVE_ALMACENAMIENTO) ?? 'null');
      const valido = usuario
        && Number.isInteger(usuario.empresaId)
        && Number.isInteger(usuario.usuarioId)
        && ROLES_VALIDOS.includes(usuario.rol);
      return valido ? usuario : null;
    } catch {
      return null;
    }
  }
}
