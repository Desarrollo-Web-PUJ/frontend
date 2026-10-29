import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import type { FlujoMensaje, FlujoMensajeRequest } from '../../../models/diagrama.model';
import { FlujoMensajeService } from '../../../services/flujo-mensaje.service';
import { Aviso } from '../../../shared/components/aviso/aviso.component';
import { DialogoConfirmacion } from '../../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { EditorBase } from './editor-base';

type TipoDestino = 'EVENTO' | 'POOL';

/**
 * HU-25 y HU-26: flujo de mensaje. A diferencia de los arcos, sí cruza pools:
 * va de un Message Throw a un Message Catch de otro pool o a un participante externo.
 */
@Component({
  selector: 'app-flujo-editor',
  imports: [ReactiveFormsModule, Aviso, DialogoConfirmacion],
  templateUrl: './flujo-editor.component.html',
  styleUrl: './editor.css'
})
export class FlujoEditor extends EditorBase {

  private readonly servicio = inject(FlujoMensajeService);

  readonly flujo = input<FlujoMensaje | null>(null);

  readonly form = new FormGroup({
    origenId: new FormControl<number | null>(null, { validators: Validators.required }),
    tipoDestino: new FormControl<TipoDestino>('EVENTO', { nonNullable: true }),
    destinoId: new FormControl<number | null>(null),
    poolDestinoId: new FormControl<number | null>(null),
    etiqueta: new FormControl('', { nonNullable: true })
  });

  private readonly origenSeleccionado = toSignal(this.form.controls.origenId.valueChanges, { initialValue: null });
  readonly tipoDestino = toSignal(this.form.controls.tipoDestino.valueChanges, { initialValue: 'EVENTO' as TipoDestino });

  readonly emisores = computed(() => this.detalle().eventosMensaje.filter(e => e.tipo === 'THROW'));

  private readonly poolOrigen = computed(() =>
    this.detalle().eventosMensaje.find(e => e.id === this.origenSeleccionado())?.poolId ?? null);

  /** Los mensajes solo son válidos si cruzan de un pool a otro. */
  readonly receptores = computed(() =>
    this.detalle().eventosMensaje.filter(e => e.tipo !== 'THROW' && e.poolId !== this.poolOrigen()));

  readonly poolsExternos = computed(() => this.detalle().pools.filter(p => p.tipo === 'EXTERNO'));

  readonly emisorIncompletoParaExterno = computed(() => {
    const emisor = this.emisores().find(e => e.id === this.origenSeleccionado());
    return this.tipoDestino() === 'POOL' && emisor != null
      && (!emisor.tipoDestinoExterno || !emisor.comportamientoFallo);
  });

  constructor() {
    super();
    effect(() => {
      const flujo = this.flujo();
      untracked(() => this.form.reset({
        origenId: flujo?.origenId ?? this.emisores()[0]?.id ?? null,
        tipoDestino: flujo?.poolDestinoId != null ? 'POOL' : 'EVENTO',
        destinoId: flujo?.destinoId ?? null,
        poolDestinoId: flujo?.poolDestinoId ?? null,
        etiqueta: flujo?.etiqueta ?? ''
      }));
    });
  }

  guardar(): void {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    if (this.form.invalid || v.origenId == null) return;

    const haciaPool = v.tipoDestino === 'POOL';
    const destinoId = haciaPool ? null : v.destinoId;
    const poolDestinoId = haciaPool ? v.poolDestinoId : null;
    if (destinoId == null && poolDestinoId == null) {
      this.error.set('Selecciona el destino del mensaje.');
      return;
    }

    const datos: FlujoMensajeRequest = {
      origenId: v.origenId,
      destinoId,
      poolDestinoId,
      etiqueta: v.etiqueta.trim() || null
    };
    const procesoId = this.detalle().id;
    const flujo = this.flujo();

    this.ejecutar(
      flujo ? this.servicio.editar(procesoId, flujo.id, datos) : this.servicio.crear(procesoId, datos),
      guardado => ({
        mensaje: flujo ? 'Flujo de mensaje actualizado.' : 'Flujo de mensaje creado.',
        advertencias: guardado.advertencias ?? []
      })
    );
  }

  eliminar(): void {
    const flujo = this.flujo();
    if (!flujo) return;
    this.ejecutar(this.servicio.eliminar(this.detalle().id, flujo.id), respuesta => respuesta);
  }
}
