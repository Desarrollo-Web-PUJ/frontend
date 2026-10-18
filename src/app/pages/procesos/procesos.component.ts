

import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import { ProcesoService } from '../../services/proceso.service';
import { AuthService } from '../../services/auth.service';

import type {
  EstadoProceso,
  ProcesoListItem
} from '../../models/proceso.model';

@Component({
  selector: 'app-procesos',
  imports: [ReactiveFormsModule],
  templateUrl: './procesos.component.html',
  styleUrl: './procesos.component.css'
})
export class Procesos implements OnInit {

  private readonly procesoService = inject(ProcesoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly procesos = signal<ProcesoListItem[]>([]);

  readonly cargando = signal(false);
  readonly error = signal('');

  readonly cerrandoSesion = signal(false);
  readonly errorLogout = signal('');

  readonly pagina = signal(0);
  readonly totalPaginas = signal(0);
  readonly totalElementos = signal(0);

  readonly filtros = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true
    }),

    estado: new FormControl<EstadoProceso | ''>('', {
      nonNullable: true
    }),

    categoria: new FormControl('', {
      nonNullable: true
    }),

    incluirInactivos: new FormControl(false, {
      nonNullable: true
    })
  });

  ngOnInit(): void {
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
      size: 10
    }).subscribe({
      next: (respuesta) => {
        this.procesos.set(respuesta.content);
        this.pagina.set(respuesta.number);
        this.totalPaginas.set(respuesta.totalPages);
        this.totalElementos.set(respuesta.totalElements);
        this.cargando.set(false);
      },

      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);

        if (error.status === 401) {
          this.error.set(
            'Tu sesion ha expirado. Inicia sesion nuevamente.'
          );
        } else if (error.status === 0 || error.status === 502) {
          this.error.set(
            'No se pudo conectar con el backend.'
          );
        } else {
          this.error.set(
            'Ocurrio un error al consultar los procesos.'
          );
        }
      }
    });
  }

  buscar(): void {
    this.pagina.set(0);
    this.cargarProcesos();
  }

  paginaAnterior(): void {
    if (this.pagina() > 0) {
      this.pagina.update(valor => valor - 1);
      this.cargarProcesos();
    }
  }

  paginaSiguiente(): void {
    if (this.pagina() + 1 < this.totalPaginas()) {
      this.pagina.update(valor => valor + 1);
      this.cargarProcesos();
    }
  }

  cerrarSesion(): void {
    if (this.cerrandoSesion()) {
      return;
    }

    this.cerrandoSesion.set(true);
    this.errorLogout.set('');

    this.authService.logout().subscribe({
      next: () => {
        this.cerrandoSesion.set(false);
        void this.router.navigate(['/login']);
      },

      error: () => {
        this.cerrandoSesion.set(false);
        this.errorLogout.set(
          'No se pudo cerrar la sesion. Intenta nuevamente.'
        );
      }
    });
  }
}
