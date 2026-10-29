import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked
} from '@angular/core';

import type { ProcesoDetalle } from '../../../models/proceso.model';
import { TIPOS_ACTIVIDAD, TipoActividad } from '../../../models/diagrama.model';
import {
  BandaPool,
  Caja,
  Desplazamiento,
  ORIGEN_X,
  DIMENSIONES,
  calcularLayout,
  partirTexto
} from './diagrama-layout';
import type { MovimientoNodo, Seleccion, TipoElemento } from './diagrama.types';

interface Arrastre {
  caja: Caja;
  inicioX: number;
  inicioY: number;
  movido: boolean;
}

const UMBRAL_ARRASTRE = 4;

/**
 * Dibujo del proceso en SVG (HU-07): pools, lanes, actividades, gateways,
 * eventos, arcos y flujos de mensaje.
 *
 * Es un componente de presentación: recibe el detalle por @Input y comunica
 * la selección y los movimientos por @Output. Quien lo usa decide qué hacer.
 */
@Component({
  selector: 'app-diagrama-proceso',
  templateUrl: './diagrama-proceso.component.html',
  styleUrl: './diagrama-proceso.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiagramaProceso {

  readonly detalle = input.required<ProcesoDetalle>();
  readonly editable = input(false);
  readonly seleccion = input<Seleccion | null>(null);

  readonly seleccionar = output<Seleccion | null>();
  readonly mover = output<MovimientoNodo>();

  private readonly desplazamiento = signal<Desplazamiento | null>(null);
  private arrastre: Arrastre | null = null;

  readonly layout = computed(() => calcularLayout(this.detalle(), this.desplazamiento()));

  readonly dim = DIMENSIONES;
  readonly origenX = ORIGEN_X;
  readonly etiquetasActividad = TIPOS_ACTIVIDAD;
  readonly partirTexto = partirTexto;

  constructor() {
    // Cuando llega el diagrama actualizado desde el servidor, el arrastre temporal ya no aplica
    effect(() => {
      this.detalle();
      untracked(() => this.desplazamiento.set(null));
    });
  }

  estaSeleccionado(tipo: TipoElemento, id: number): boolean {
    const actual = this.seleccion();
    return actual?.tipo === tipo && actual.id === id;
  }

  elegir(tipo: TipoElemento, id: number, evento?: Event): void {
    evento?.stopPropagation();
    this.seleccionar.emit({ tipo, id });
  }

  limpiarSeleccion(): void {
    this.seleccionar.emit(null);
  }

  etiquetaActividad(tipo: TipoActividad): string {
    return this.etiquetasActividad[tipo];
  }

  puntosRombo(caja: Caja): string {
    const cx = caja.x + caja.ancho / 2;
    const cy = caja.y + caja.alto / 2;
    const r = caja.ancho / 2;
    return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
  }

  // ---------- Arrastrar y soltar (solo en modo edición) ----------

  iniciarArrastre(evento: PointerEvent, caja: Caja): void {
    evento.stopPropagation();
    if (!this.editable() || evento.button !== 0) {
      this.elegir(caja.tipo, caja.id);
      return;
    }
    (evento.currentTarget as Element).setPointerCapture?.(evento.pointerId);
    this.arrastre = { caja, inicioX: evento.clientX, inicioY: evento.clientY, movido: false };
  }

  moverArrastre(evento: PointerEvent): void {
    const arrastre = this.arrastre;
    if (!arrastre) return;

    const dx = evento.clientX - arrastre.inicioX;
    const dy = evento.clientY - arrastre.inicioY;
    if (!arrastre.movido && Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;

    arrastre.movido = true;
    this.desplazamiento.set({ clave: arrastre.caja.clave, dx, dy });
  }

  terminarArrastre(): void {
    const arrastre = this.arrastre;
    this.arrastre = null;
    if (!arrastre) return;

    if (!arrastre.movido) {
      this.desplazamiento.set(null);
      this.elegir(arrastre.caja.tipo, arrastre.caja.id);
      return;
    }

    const movimiento = this.calcularMovimiento(arrastre.caja.clave);
    if (movimiento) {
      // El nodo se queda en su nueva posición hasta que llegue el diagrama actualizado
      this.mover.emit(movimiento);
    } else {
      this.desplazamiento.set(null);
    }
  }

  cancelarArrastre(): void {
    this.arrastre = null;
    this.desplazamiento.set(null);
  }

  /** Traduce la posición final en el lienzo a las coordenadas que guarda el backend. */
  private calcularMovimiento(clave: string): MovimientoNodo | null {
    const layout = this.layout();
    const caja = [...layout.actividades, ...layout.gateways, ...layout.eventos]
      .map(nodo => nodo.caja)
      .find(c => c.clave === clave);
    const banda = layout.pools.find(b => b.pool.id === caja?.poolId);
    if (!caja || !banda) return null;

    const centroY = caja.y + caja.alto / 2;
    const laneDestino = this.laneEn(banda, centroY);

    // Una actividad siempre pertenece a una lane; un evento solo si ya tenía una
    let laneId: number | null = null;
    if (caja.tipo === 'ACTIVIDAD') {
      laneId = laneDestino ?? caja.laneId;
    } else if (caja.tipo === 'EVENTO' && caja.laneId != null) {
      laneId = laneDestino ?? caja.laneId;
    }

    return {
      tipo: caja.tipo,
      id: caja.id,
      posicionX: Math.max(0, Math.round(caja.x - ORIGEN_X)),
      posicionY: Math.round(Math.min(Math.max(centroY - banda.y, 0), banda.alto)),
      laneId
    };
  }

  private laneEn(banda: BandaPool, y: number): number | null {
    return banda.lanes.find(l => y >= l.y && y < l.y + l.alto)?.lane.id ?? null;
  }
}
