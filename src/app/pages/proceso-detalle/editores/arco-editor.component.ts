import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import type { Arco, ArcoRequest } from '../../../models/diagrama.model';
import { ArcoService } from '../../../services/arco.service';
import { Aviso } from '../../../shared/components/aviso/aviso.component';
import { DialogoConfirmacion } from '../../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { EditorBase } from './editor-base';
import { leerValorNodo, opcionesNodos, valorNodo } from './nodos';

/**
 * HU-11 a HU-13: arcos (flujos de secuencia). Unen dos nodos del mismo pool;
 * entre pools se usan flujos de mensaje. Si salen de un gateway exclusivo o
 * inclusivo llevan una condición.
 */
@Component({
  selector: 'app-arco-editor',
  imports: [ReactiveFormsModule, Aviso, DialogoConfirmacion],
  templateUrl: './arco-editor.component.html',
  styleUrl: './editor.css'
})
export class ArcoEditor extends EditorBase {

  private readonly servicio = inject(ArcoService);

  readonly arco = input<Arco | null>(null);

  readonly form = new FormGroup({
    origen: new FormControl('', { nonNullable: true, validators: Validators.required }),
    destino: new FormControl('', { nonNullable: true, validators: Validators.required }),
    etiqueta: new FormControl('', { nonNullable: true }),
    condicion: new FormControl('', { nonNullable: true })
  });

  private readonly origenSeleccionado = toSignal(this.form.controls.origen.valueChanges, { initialValue: '' });

  readonly nodos = computed(() => opcionesNodos(this.detalle()));

  /** Los arcos no cruzan pools: el destino se elige entre los nodos del pool del origen. */
  readonly destinosPosibles = computed(() => {
    const origen = this.nodos().find(n => n.valor === this.origenSeleccionado());
    return origen
      ? this.nodos().filter(n => n.poolId === origen.poolId && n.valor !== origen.valor)
      : [];
  });

  /** Tipo del gateway de origen, si el arco sale de uno. */
  readonly gatewayOrigen = computed(() => {
    const origen = leerValorNodo(this.origenSeleccionado());
    return origen?.tipo === 'GATEWAY'
      ? this.detalle().gateways.find(g => g.id === origen.id) ?? null
      : null;
  });
  readonly requiereCondicion = computed(() => {
    const tipo = this.gatewayOrigen()?.tipo;
    return tipo === 'EXCLUSIVO' || tipo === 'INCLUSIVO';
  });

  constructor() {
    super();
    effect(() => {
      const arco = this.arco();
      untracked(() => this.form.reset({
        origen: arco ? valorNodo(arco.tipoOrigen, arco.origenId) : '',
        destino: arco ? valorNodo(arco.tipoDestino, arco.destinoId) : '',
        etiqueta: arco?.etiqueta ?? '',
        condicion: arco?.condicion ?? ''
      }));
    });
  }

  guardar(): void {
    this.form.markAllAsTouched();
    const valores = this.form.getRawValue();
    const origen = leerValorNodo(valores.origen);
    const destino = leerValorNodo(valores.destino);
    const condicion = valores.condicion.trim();

    if (this.form.invalid || !origen || !destino) return;
    if (this.requiereCondicion() && !condicion) {
      this.error.set('Los arcos que salen de un gateway exclusivo o inclusivo necesitan una condición.');
      return;
    }

    const datos: ArcoRequest = {
      tipoOrigen: origen.tipo,
      origenId: origen.id,
      tipoDestino: destino.tipo,
      destinoId: destino.id,
      etiqueta: valores.etiqueta.trim() || null,
      condicion: this.requiereCondicion() ? condicion : null
    };
    const procesoId = this.detalle().id;
    const arco = this.arco();

    this.ejecutar(
      arco ? this.servicio.editar(procesoId, arco.id, datos) : this.servicio.crear(procesoId, datos),
      () => ({ mensaje: arco ? 'Arco actualizado.' : 'Arco creado.', advertencias: [] })
    );
  }

  eliminar(): void {
    const arco = this.arco();
    if (!arco) return;
    this.ejecutar(this.servicio.eliminar(this.detalle().id, arco.id), respuesta => respuesta);
  }
}
