import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  COMPORTAMIENTOS_FALLO,
  COMPORTAMIENTOS_SIN_CORRELACION,
  TIPOS_DESTINO_EXTERNO,
  TIPOS_EVENTO
} from '../../../models/diagrama.model';
import type {
  ComportamientoFallo,
  ComportamientoSinCorrelacion,
  EventoMensaje,
  EventoMensajeRequest,
  TipoDestinoExterno,
  TipoEventoMensaje
} from '../../../models/diagrama.model';
import { EventoMensajeService } from '../../../services/evento-mensaje.service';
import { Aviso } from '../../../shared/components/aviso/aviso.component';
import { DialogoConfirmacion } from '../../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { noVacio } from '../../../shared/validadores';
import { siguientePosicionX } from '../diagrama/diagrama-layout';
import { EditorBase } from './editor-base';

type FormCampo = FormGroup<{ nombre: FormControl<string>; tipoDato: FormControl<string> }>;

/**
 * HU-25 a HU-28: eventos de mensaje.
 *  - Throw: envía un mensaje a otro pool o a un sistema externo (HU-25, HU-26).
 *  - Catch: recibe el mensaje; el de inicio arranca el proceso (HU-27).
 *  - La clave de correlación indica a qué caso pertenece el mensaje (HU-28).
 */
@Component({
  selector: 'app-evento-editor',
  imports: [ReactiveFormsModule, Aviso, DialogoConfirmacion],
  templateUrl: './evento-editor.component.html',
  styleUrl: './editor.css'
})
export class EventoEditor extends EditorBase {

  private readonly servicio = inject(EventoMensajeService);

  readonly evento = input<EventoMensaje | null>(null);

  readonly tipos = Object.entries(TIPOS_EVENTO) as [TipoEventoMensaje, string][];
  readonly destinosExternos = Object.entries(TIPOS_DESTINO_EXTERNO) as [TipoDestinoExterno, string][];
  readonly comportamientosFallo = Object.entries(COMPORTAMIENTOS_FALLO) as [ComportamientoFallo, string][];
  readonly comportamientosSinCorrelacion =
    Object.entries(COMPORTAMIENTOS_SIN_CORRELACION) as [ComportamientoSinCorrelacion, string][];

  readonly form = new FormGroup({
    tipo: new FormControl<TipoEventoMensaje>('THROW', { nonNullable: true }),
    poolId: new FormControl<number | null>(null, { validators: Validators.required }),
    laneId: new FormControl<number | null>(null),
    nombreMensaje: new FormControl('', { nonNullable: true, validators: [Validators.required, noVacio] }),
    claveCorrelacion: new FormControl('', { nonNullable: true }),
    tipoDestinoExterno: new FormControl<TipoDestinoExterno | null>(null),
    comportamientoFallo: new FormControl<ComportamientoFallo | null>(null),
    comportamientoSinCorrelacion: new FormControl<ComportamientoSinCorrelacion | null>(null),
    origenExterno: new FormControl(false, { nonNullable: true }),
    campos: new FormArray<FormCampo>([]),
    actividadesConsumidoras: new FormControl<number[]>([], { nonNullable: true })
  });

  private readonly tipoSeleccionado = toSignal(this.form.controls.tipo.valueChanges, { initialValue: 'THROW' as TipoEventoMensaje });
  private readonly poolSeleccionado = toSignal(this.form.controls.poolId.valueChanges, { initialValue: null });

  readonly esThrow = computed(() => this.tipoSeleccionado() === 'THROW');
  readonly esCatchInicio = computed(() => this.tipoSeleccionado() === 'CATCH_INICIO');

  readonly poolsPropios = computed(() => this.detalle().pools.filter(pool => pool.tipo === 'PROPIO'));
  readonly lanesDelPool = computed(() =>
    this.detalle().lanes
      .filter(lane => lane.poolId === this.poolSeleccionado())
      .sort((a, b) => a.orden - b.orden));
  readonly actividades = computed(() => this.detalle().actividades);

  constructor() {
    super();
    effect(() => {
      const evento = this.evento();
      const poolInicial = evento?.poolId ?? this.poolsPropios()[0]?.id ?? null;
      untracked(() => this.cargarEvento(evento, poolInicial));
    });
  }

  get campos(): FormArray<FormCampo> {
    return this.form.controls.campos;
  }

  agregarCampo(nombre = '', tipoDato = 'Texto'): void {
    this.campos.push(new FormGroup({
      nombre: new FormControl(nombre, { nonNullable: true, validators: [Validators.required, noVacio] }),
      tipoDato: new FormControl(tipoDato, { nonNullable: true })
    }));
  }

  quitarCampo(indice: number): void {
    this.campos.removeAt(indice);
  }

  consumeActividad(id: number): boolean {
    return this.form.controls.actividadesConsumidoras.value.includes(id);
  }

  alternarActividad(id: number, marcada: boolean): void {
    const actuales = this.form.controls.actividadesConsumidoras.value;
    this.form.controls.actividadesConsumidoras.setValue(
      marcada ? [...actuales, id] : actuales.filter(actual => actual !== id));
  }

  guardar(): void {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    if (this.form.invalid || v.poolId == null) return;

    if (v.origenExterno && this.esCatchInicio() && !v.comportamientoSinCorrelacion) {
      this.error.set('Indica qué hacer con los mensajes externos que no traen correlación.');
      return;
    }

    const detalle = this.detalle();
    const evento = this.evento();
    const esThrow = v.tipo === 'THROW';
    const conservaPosicion = evento != null && evento.poolId === v.poolId;
    // Si se cambió de pool, una lane del pool anterior ya no aplica
    const laneValida = this.lanesDelPool().some(lane => lane.id === v.laneId);

    const datos: EventoMensajeRequest = {
      tipo: v.tipo,
      poolId: v.poolId,
      laneId: laneValida ? v.laneId : null,
      nombreMensaje: v.nombreMensaje.trim(),
      claveCorrelacion: v.claveCorrelacion.trim() || null,
      // Cada tipo solo envía los atributos que le aplican
      tipoDestinoExterno: esThrow ? v.tipoDestinoExterno : null,
      comportamientoFallo: esThrow ? v.comportamientoFallo : null,
      comportamientoSinCorrelacion: esThrow ? null : v.comportamientoSinCorrelacion,
      origenExterno: v.tipo === 'CATCH_INICIO' && v.origenExterno,
      campos: v.campos.map(campo => ({ nombre: campo.nombre.trim(), tipoDato: campo.tipoDato.trim() })),
      actividadesConsumidoras: esThrow ? [] : v.actividadesConsumidoras,
      posicionX: conservaPosicion ? evento.posicionX : siguientePosicionX(detalle, v.poolId),
      posicionY: conservaPosicion ? evento.posicionY : null
    };

    this.ejecutar(
      evento ? this.servicio.editar(detalle.id, evento.id, datos) : this.servicio.crear(detalle.id, datos),
      guardado => ({
        mensaje: `Evento "${guardado.nombreMensaje}" ${evento ? 'actualizado' : 'creado'}.`,
        advertencias: guardado.advertencias ?? []
      })
    );
  }

  eliminar(): void {
    const evento = this.evento();
    if (!evento) return;
    this.ejecutar(this.servicio.eliminar(this.detalle().id, evento.id), respuesta => respuesta);
  }

  private cargarEvento(evento: EventoMensaje | null, poolInicial: number | null): void {
    this.campos.clear();
    this.form.reset({
      tipo: evento?.tipo ?? 'THROW',
      poolId: poolInicial,
      laneId: evento?.laneId ?? null,
      nombreMensaje: evento?.nombreMensaje ?? '',
      claveCorrelacion: evento?.claveCorrelacion ?? '',
      tipoDestinoExterno: evento?.tipoDestinoExterno ?? null,
      comportamientoFallo: evento?.comportamientoFallo ?? null,
      comportamientoSinCorrelacion: evento?.comportamientoSinCorrelacion ?? null,
      origenExterno: evento?.origenExterno ?? false,
      actividadesConsumidoras: evento?.actividadesConsumidoras ?? []
    });
    for (const campo of evento?.campos ?? []) {
      this.agregarCampo(campo.nombre, campo.tipoDato);
    }
  }
}
