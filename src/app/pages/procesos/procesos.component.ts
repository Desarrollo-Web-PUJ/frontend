import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import type { EstadoProceso, ProcesoListItem } from '../../models/proceso.model';
import { AuthService } from '../../services/auth.service';
import { ProcesoService } from '../../services/proceso.service';
import { Aviso } from '../../shared/components/aviso/aviso.component';
import { DialogoConfirmacion } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { Paginador } from '../../shared/components/paginador/paginador.component';
import { mensajeApi } from '../../shared/error-api';

const TAMANO_PAGINA = 10;

/** HU-07: listado paginado de procesos con búsqueda y filtros; HU-06: eliminación. */
@Component({
  selector: 'app-procesos',
  imports: [ReactiveFormsModule, RouterLink, Paginador, DialogoConfirmacion, Aviso],
  templateUrl: './procesos.component.html',
  styleUrl: './procesos.component.css'
})
export class Procesos implements OnInit {

  private readonly procesoService = inject(ProcesoService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly procesos = signal<ProcesoListItem[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly mensaje = signal('');
  readonly errorAccion = signal('');
  readonly pendiente = signal<ProcesoListItem | null>(null);
  readonly eliminando = signal(false);

  readonly pagina = signal(0);
  readonly totalPaginas = signal(0);
  readonly totalElementos = signal(0);

  readonly filtros = new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    estado: new FormControl<EstadoProceso | ''>('', { nonNullable: true }),
    categoria: new FormControl('', { nonNullable: true }),
    incluirInactivos: new FormControl(false, { nonNullable: true })
  });

  ngOnInit(): void {
    // El formulario de proceso envía este mensaje al volver después de guardar
    const mensaje = this.router.currentNavigation()?.extras.state?.['mensaje'] ?? history.state?.mensaje;
    if (typeof mensaje === 'string') {
      this.mensaje.set(mensaje);
    }
    history.replaceState({ ...history.state, mensaje: undefined }, '');
    this.cargarProcesos();
  }

  cargarProcesos(): void {
    this.cargando.set(true);
    this.error.set('');
    const valores = this.filtros.getRawValue();

    this.procesoService.listar({
      nombre: valores.nombre,
      estado: valores.estado || undefined,
      categoria: valores.categoria,
      incluirInactivos: valores.incluirInactivos,
      page: this.pagina(),
      size: TAMANO_PAGINA
    }).pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: respuesta => {
          this.procesos.set(respuesta.content);
          this.pagina.set(respuesta.number);
          this.totalPaginas.set(respuesta.totalPages);
          this.totalElementos.set(respuesta.totalElements);
        },
        error: (error: HttpErrorResponse) => this.error.set(mensajeApi(error))
      });
  }

  buscar(): void {
    if (this.cargando()) return;
    this.pagina.set(0);
    this.cargarProcesos();
  }

  irAPagina(pagina: number): void {
    if (this.cargando()) return;
    this.pagina.set(pagina);
    this.cargarProcesos();
  }

  limpiarFiltros(): void {
    if (this.cargando()) return;
    this.filtros.reset({ nombre: '', estado: '', categoria: '', incluirInactivos: false });
    this.buscar();
  }

  eliminar(): void {
    const proceso = this.pendiente();
    if (!proceso || this.eliminando() || !this.authService.esAdministrador()) return;

    this.eliminando.set(true);
    this.errorAccion.set('');
    this.mensaje.set('');

    this.procesoService.eliminar(proceso.id)
      .pipe(finalize(() => this.eliminando.set(false)))
      .subscribe({
        next: () => {
          this.pendiente.set(null);
          this.mensaje.set('Proceso desactivado correctamente. Puedes consultarlo incluyendo los inactivos.');
          // Si se retira el último elemento de la página, se vuelve a la anterior
          const quedaPaginaVacia = !this.filtros.controls.incluirInactivos.value
            && this.procesos().length === 1
            && this.pagina() > 0;
          if (quedaPaginaVacia) {
            this.pagina.update(pagina => pagina - 1);
          }
          this.cargarProcesos();
        },
        error: error => this.errorAccion.set(mensajeApi(error))
      });
  }
}
