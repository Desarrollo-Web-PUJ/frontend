// Roles de proceso (HU-17 a HU-20): la función responsable de una actividad.
// No confundir con el rol de acceso del usuario (auth.model.ts).

export interface RolProceso {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface ProcesoUso {
  id: number;
  nombre: string;
}

export interface RolProcesoListItem extends RolProceso {
  procesos: ProcesoUso[];
  enUso: boolean;
  eliminable: boolean;
}

export interface RolProcesoRequest {
  nombre: string;
  descripcion: string | null;
}
