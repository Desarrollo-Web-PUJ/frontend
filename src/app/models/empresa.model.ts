// Registro de empresa (HU-01)

export interface EmpresaRegistroRequest {
  nombre: string;
  nit: string;
  correoContacto: string;
  adminNombre: string;
  adminCorreo: string;
  adminPassword: string;
}

export interface EmpresaResponse {
  id: number;
  nombre: string;
  nit: string;
  correoContacto: string;
  adminUsuarioId: number;
}
