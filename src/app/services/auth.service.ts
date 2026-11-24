import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, tap } from 'rxjs';

import { LoginRequest, LoginResponse, RolUsuario, TokenResponse } from '../models/auth.model';

const CLAVE_USUARIO = 'usuarioActual';
const CLAVE_TOKEN = 'tokenAcceso';
const ROLES_VALIDOS: readonly RolUsuario[] = ['ADMINISTRADOR', 'EDITOR', 'LECTURA'];

/**
 * Estado del usuario autenticado, compartido por toda la aplicación.
 *
 * La autenticación es con JWT: al iniciar sesión el backend (Spring Security)
 * devuelve un token que se guarda en sessionStorage (se borra al cerrar la
 * pestaña) y que el interceptor envía en cada petición como
 * "Authorization: Bearer <token>". Los datos del usuario solo sirven para
 * mostrar u ocultar acciones: el backend vuelve a validar todo.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly url = '/api/auth';

  readonly usuario = signal<LoginResponse | null>(this.leerUsuario());
  readonly token = signal<string | null>(this.leerToken());
  readonly esAdministrador = computed(() => this.usuario()?.rol === 'ADMINISTRADOR');
  readonly puedeEditar = computed(() => {
    const rol = this.usuario()?.rol;
    return rol === 'ADMINISTRADOR' || rol === 'EDITOR';
  });

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<TokenResponse>(`${this.url}/login`, datos).pipe(
      tap(respuesta => {
        this.guardarToken(respuesta.token);
        this.guardarUsuario(respuesta.usuario);
      }),
      map(respuesta => respuesta.usuario)
    );
  }

  /** Consulta al servidor el usuario dueño del token (rol y empresa actualizados). */
  cargarSesion(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.url}/sesion`)
      .pipe(tap(usuario => this.guardarUsuario(usuario)));
  }

  /** La API no guarda estado: cerrar sesión es descartar el token en el navegador. */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.url}/logout`, {})
      .pipe(finalize(() => this.limpiarSesion()));
  }

  limpiarSesion(): void {
    this.usuario.set(null);
    this.token.set(null);
    sessionStorage.removeItem(CLAVE_USUARIO);
    sessionStorage.removeItem(CLAVE_TOKEN);
  }

  private guardarToken(token: string): void {
    this.token.set(token);
    sessionStorage.setItem(CLAVE_TOKEN, token);
  }

  private guardarUsuario(usuario: LoginResponse): void {
    this.usuario.set(usuario);
    // Nunca se guarda la contraseña: solo los datos de la respuesta del servidor
    sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  }

  private leerToken(): string | null {
    const token = sessionStorage.getItem(CLAVE_TOKEN);
    return token && token.split('.').length === 3 ? token : null;
  }

  private leerUsuario(): LoginResponse | null {
    try {
      const usuario = JSON.parse(sessionStorage.getItem(CLAVE_USUARIO) ?? 'null');
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
