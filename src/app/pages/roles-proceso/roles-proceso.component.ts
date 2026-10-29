import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { RolProcesoListItem } from '../../models/rol-proceso.model';
import { AuthService } from '../../services/auth.service';
import { RolProcesoService } from '../../services/rol-proceso.service';
import { Aviso } from '../../shared/components/aviso/aviso.component';
import { DialogoConfirmacion } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { Paginador } from '../../shared/components/paginador/paginador.component';
import { mensajeApi } from '../../shared/error-api';
import { noVacio } from '../../shared/validadores';

/**
 * HU-17 a HU-20: catálogo de roles de proceso (Analista, Supervisor...).
 * Cada rol nombra una lane del diagrama. Solo el administrador lo modifica.
 */
@Component({
  selector: 'app-roles-proceso',
  imports: [ReactiveFormsModule, RouterLink, Paginador, DialogoConfirmacion, Aviso],
  templateUrl: './roles-proceso.component.html',
  styleUrls: ['../../shared/gestion.css', './roles-proceso.component.css']
})
export class RolesProceso implements OnInit {

  readonly auth = inject(AuthService);
  private readonly servicio = inject(RolProcesoService);

  readonly roles = signal<RolProcesoListItem[]>([]);
  readonly cargando = signal(false);
  readonly errorCarga = signal('');
  readonly pagina = signal(0);
  readonly totalPaginas = signal(0);

  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly enEdicion = signal<RolProcesoListItem | null>(null);
  readonly pendiente = signal<RolProcesoListItem | null>(null);

  readonly busqueda = new FormControl('', { nonNullable: true });

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, noVacio, Validators.maxLength(80)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) })
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set('');
    this.servicio.consultar(this.busqueda.value, this.pagina())
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: respuesta => {
          this.roles.set(respuesta.content);
          this.pagina.set(respuesta.number);
          this.totalPaginas.set(respuesta.totalPages);
        },
        error: error => this.errorCarga.set(mensajeApi(error))
      });
  }

  buscar(): void {
    this.pagina.set(0);
    this.cargar();
  }

  irAPagina(pagina: number): void {
    this.pagina.set(pagina);
    this.cargar();
  }

  editar(rol: RolProcesoListItem): void {
    this.enEdicion.set(rol);
    this.form.setValue({ nombre: rol.nombre, descripcion: rol.descripcion ?? '' });
    this.error.set('');
  }

  cancelarEdicion(): void {
    this.enEdicion.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
    this.error.set('');
  }

  guardar(): void {
    if (this.guardando()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const valores = this.form.getRawValue();
    const datos = { nombre: valores.nombre.trim(), descripcion: valores.descripcion.trim() || null };
    const rol = this.enEdicion();
    const peticion = rol ? this.servicio.editar(rol.id, datos) : this.servicio.crear(datos);

    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: guardado => {
        this.mensaje.set(rol
          ? `Rol "${guardado.nombre}" actualizado. Las lanes que lo usan muestran el nuevo nombre.`
          : `Rol "${guardado.nombre}" creado. Ya puede usarse para nombrar lanes.`);
        this.cancelarEdicion();
        this.cargar();
      },
      error: error => this.error.set(mensajeApi(error))
    });
  }

  eliminar(): void {
    const rol = this.pendiente();
    if (!rol || this.guardando()) return;

    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.servicio.eliminar(rol.id).pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        this.pendiente.set(null);
        this.mensaje.set(`Rol "${rol.nombre}" eliminado.`);
        if (this.roles().length === 1 && this.pagina() > 0) {
          this.pagina.update(pagina => pagina - 1);
        }
        this.cargar();
      },
      error: error => {
        this.pendiente.set(null);
        this.error.set(mensajeApi(error));
      }
    });
  }
}
