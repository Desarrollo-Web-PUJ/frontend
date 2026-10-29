import { Directive, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';

import type { ProcesoDetalle } from '../../../models/proceso.model';
import { AuthService } from '../../../services/auth.service';
import { mensajeApi } from '../../../shared/error-api';
import type { ResultadoEdicion } from '../diagrama/diagrama.types';

/**
 * Comportamiento común de los editores de elementos del diagrama:
 * entradas/salidas, estado de guardado, errores y confirmación de eliminación.
 */
@Directive()
export abstract class EditorBase {

  protected readonly auth = inject(AuthService);

  readonly detalle = input.required<ProcesoDetalle>();
  /** En solo lectura el editor funciona como ficha del elemento. */
  readonly soloLectura = input(false);

  readonly guardado = output<ResultadoEdicion>();
  readonly cancelado = output<void>();

  readonly guardando = signal(false);
  readonly error = signal('');
  readonly confirmandoEliminacion = signal(false);

  readonly esAdministrador = this.auth.esAdministrador;

  protected ejecutar<T>(peticion: Observable<T>, resultado: (respuesta: T) => ResultadoEdicion): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.error.set('');

    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: respuesta => {
        this.confirmandoEliminacion.set(false);
        this.guardado.emit(resultado(respuesta));
      },
      error: (error: HttpErrorResponse) => {
        this.confirmandoEliminacion.set(false);
        this.error.set(mensajeApi(error));
      }
    });
  }
}
