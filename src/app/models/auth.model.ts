
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
