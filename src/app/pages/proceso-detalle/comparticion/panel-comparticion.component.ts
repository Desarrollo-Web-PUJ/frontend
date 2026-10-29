import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import type { ProcesoCompartido } from '../../../models/proceso.model';
import { ComparticionService } from '../../../services/comparticion.service';
import { Aviso } from '../../../shared/components/aviso/aviso.component';
import { mensajeApi } from '../../../shared/error-api';

/**
 * HU-23: el administrador comparte el modelo del proceso con otras empresas,
 * que solo pueden consultarlo. Nunca se comparten usuarios ni roles.
 */
@Component({
  selector: 'app-panel-comparticion',
  imports: [ReactiveFormsModule, DatePipe, Aviso],
  templateUrl: './panel-comparticion.component.html',
  styleUrl: '../editores/editor.css'
})
export class PanelComparticion implements OnInit {

  private readonly servicio = inject(ComparticionService);

  readonly procesoId = input.required<number>();
  readonly cambio = output<void>();

  readonly comparticiones = signal<ProcesoCompartido[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly empresaDestino = new FormControl<number | null>(null, [Validators.required, Validators.min(1)]);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.servicio.listar(this.procesoId())
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: lista => this.comparticiones.set(lista),
        error: error => this.error.set(mensajeApi(error))
      });
  }

  compartir(): void {
    this.empresaDestino.markAsTouched();
    const empresaId = this.empresaDestino.value;
    if (this.empresaDestino.invalid || empresaId == null || this.guardando()) return;

    this.ejecutar(this.servicio.compartir(this.procesoId(), empresaId), compartido => {
      this.empresaDestino.reset();
      return `Proceso compartido en solo lectura con "${compartido.empresaDestinoNombre}".`;
    });
  }

  dejarDeCompartir(comparticion: ProcesoCompartido): void {
    if (this.guardando()) return;
    this.ejecutar(
      this.servicio.dejarDeCompartir(this.procesoId(), comparticion.empresaDestinoId),
      () => `Se dejó de compartir con "${comparticion.empresaDestinoNombre}".`
    );
  }

  private ejecutar<T>(peticion: Observable<T>, exito: (respuesta: T) => string): void {
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: respuesta => {
        this.mensaje.set(exito(respuesta));
        this.cargar();
        this.cambio.emit();
      },
      error: error => this.error.set(mensajeApi(error))
    });
  }
}
