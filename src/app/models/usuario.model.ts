import type { RolUsuario } from './auth.model';

export interface UsuarioResponse {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  empresaId: number;
}

export interface UsuarioRegistroRequest {
  nombre: string;
  correo: string;
  password: string;
  rol: RolUsuario;
}
