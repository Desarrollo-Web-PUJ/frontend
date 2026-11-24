
export type RolUsuario =
  | 'ADMINISTRADOR'
  | 'EDITOR'
  | 'LECTURA';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  usuarioId: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  empresaId: number;
}

/** Respuesta del inicio de sesión: el JWT y los datos del usuario. */
export interface TokenResponse {
  token: string;
  tipo: 'Bearer';
  expiraEnSegundos: number;
  usuario: LoginResponse;
}
