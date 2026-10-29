import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, map, Observable } from 'rxjs';

import type { HistorialProceso, ProcesoDetalle } from '../../models/proceso.model';
import { ActividadService } from '../../services/actividad.service';
import { AuthService } from '../../services/auth.service';
import { EventoMensajeService } from '../../services/evento-mensaje.service';
import { GatewayService } from '../../services/gateway.service';
import { ProcesoService } from '../../services/proceso.service';
import { Aviso } from '../../shared/components/aviso/aviso.component';
import { mensajeApi } from '../../shared/error-api';
import { PanelComparticion } from './comparticion/panel-comparticion.component';
import { DiagramaProceso } from './diagrama/diagrama-proceso.component';
import { validarDiagrama } from './diagrama/diagrama-validacion';
import type { MovimientoNodo, ResultadoEdicion, Seleccion, TipoElemento } from './diagrama/diagrama.types';
import { ActividadEditor } from './editores/actividad-editor.component';
import { ArcoEditor } from './editores/arco-editor.component';
import { EventoEditor } from './editores/evento-editor.component';
import { FlujoEditor } from './editores/flujo-editor.component';
import { GatewayEditor } from './editores/gateway-editor.component';
import { LaneEditor } from './editores/lane-editor.component';
import { PoolEditor } from './editores/pool-editor.component';
import { eventoARequest } from './editores/nodos';

type Pestana = 'diagrama' | 'historial' | 'compartir';

const ELEMENTOS_CREABLES: { tipo: TipoElemento; etiqueta: string }[] = [
  { tipo: 'POOL', etiqueta: 'Pool' },
  { tipo: 'LANE', etiqueta: 'Lane' },
  { tipo: 'ACTIVIDAD', etiqueta: 'Actividad' },
  { tipo: 'GATEWAY', etiqueta: 'Gateway' },
  { tipo: 'ARCO', etiqueta: 'Arco' },
  { tipo: 'EVENTO', etiqueta: 'Evento de mensaje' },
  { tipo: 'FLUJO', etiqueta: 'Flujo de mensaje' }
];

/**
 * HU-07: visualización del diagrama completo del proceso, su historial y,
 * para editores, el modelado de todos sus elementos (HU-08 a HU-28).
 *
 * Es el componente "contenedor": carga los datos, coordina el diagrama
 * (presentación) con los editores y refresca todo después de cada cambio.
 */
@Component({
  selector: 'app-proceso-detalle',
  imports: [
    RouterLink, DatePipe, Aviso, DiagramaProceso, PanelComparticion,
    PoolEditor, LaneEditor, ActividadEditor, GatewayEditor, ArcoEditor, EventoEditor, FlujoEditor
  ],
  templateUrl: './proceso-detalle.component.html',
  styleUrl: './proceso-detalle.component.css'
})
export class ProcesoDetallePage implements OnInit {

  private readonly procesoService = inject(ProcesoService);
  private readonly actividadService = inject(ActividadService);
  private readonly gatewayService = inject(GatewayService);
  private readonly eventoService = inject(EventoMensajeService);
  readonly auth = inject(AuthService);

  /** Parámetro :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly detalle = signal<ProcesoDetalle | null>(null);
  readonly cargando = signal(true);
  readonly errorCarga = signal('');

  readonly historial = signal<HistorialProceso[]>([]);
  readonly cargandoHistorial = signal(false);

  readonly pestana = signal<Pestana>('diagrama');
  readonly seleccion = signal<Seleccion | null>(null);
  readonly creando = signal<TipoElemento | null>(null);

  readonly mensaje = signal('');
  readonly advertencias = signal<string[]>([]);
  readonly errorAccion = signal('');

  readonly elementosCreables = ELEMENTOS_CREABLES;

  /** Un proceso compartido por otra empresa siempre es de solo lectura (HU-23). */
  readonly esPropio = computed(() => this.detalle()?.empresaId === this.auth.usuario()?.empresaId);
  readonly editable = computed(() =>
    this.esPropio() && this.detalle()?.activo === true && this.auth.puedeEditar());

  /** Revisión de coherencia del modelo, recalculada con cada cambio. */
  readonly revisionModelo = computed(() => {
    const detalle = this.detalle();
    return detalle ? validarDiagrama(detalle) : [];
  });

  readonly resumen = computed(() => {
    const d = this.detalle();
    return d ? [
      { nombre: 'Pools', valor: d.pools.length },
      { nombre: 'Lanes', valor: d.lanes.length },
      { nombre: 'Actividades', valor: d.actividades.length },
      { nombre: 'Gateways', valor: d.gateways.length },
      { nombre: 'Arcos', valor: d.arcos.length },
      { nombre: 'Eventos / flujos de mensaje', valor: `${d.eventosMensaje.length} / ${d.flujosMensaje.length}` }
    ] : [];
  });

  // Elemento seleccionado en el diagrama, ya resuelto con sus datos
  readonly poolSeleccionado = computed(() => this.buscar('POOL', d => d.pools));
  readonly laneSeleccionada = computed(() => this.buscar('LANE', d => d.lanes));
  readonly actividadSeleccionada = computed(() => this.buscar('ACTIVIDAD', d => d.actividades));
  readonly gatewaySeleccionado = computed(() => this.buscar('GATEWAY', d => d.gateways));
  readonly arcoSeleccionado = computed(() => this.buscar('ARCO', d => d.arcos));
  readonly eventoSeleccionado = computed(() => this.buscar('EVENTO', d => d.eventosMensaje));
  readonly flujoSeleccionado = computed(() => this.buscar('FLUJO', d => d.flujosMensaje));

  readonly panelAbierto = computed(() => this.creando() !== null || this.seleccion() !== null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const id = Number(this.id());
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.cargando.set(false);
      this.errorCarga.set('El identificador del proceso no es válido.');
      return;
    }

    this.errorCarga.set('');
    this.procesoService.obtener(id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: detalle => {
          this.detalle.set(detalle);
          this.descartarSeleccionInexistente();
        },
        error: (error: HttpErrorResponse) => this.errorCarga.set(mensajeApi(error))
      });
  }

  cambiarPestana(pestana: Pestana): void {
    this.pestana.set(pestana);
    if (pestana === 'historial') {
      this.cargarHistorial();
    }
  }

  cargarHistorial(): void {
    const detalle = this.detalle();
    if (!detalle || !this.esPropio()) return;

    this.cargandoHistorial.set(true);
    this.procesoService.historial(detalle.id)
      .pipe(finalize(() => this.cargandoHistorial.set(false)))
      .subscribe({
        next: historial => this.historial.set(historial),
        error: error => this.errorAccion.set(mensajeApi(error))
      });
  }

  // ---------- Interacción con el diagrama y los editores ----------

  alSeleccionar(seleccion: Seleccion | null): void {
    this.creando.set(null);
    this.seleccion.set(seleccion);
  }

  crear(tipo: TipoElemento): void {
    this.seleccion.set(null);
    this.creando.set(tipo);
    this.limpiarAvisos();
  }

  cerrarPanel(): void {
    this.creando.set(null);
    this.seleccion.set(null);
  }

  alGuardar(resultado: ResultadoEdicion): void {
    this.mensaje.set(resultado.mensaje);
    this.advertencias.set(resultado.advertencias);
    this.errorAccion.set('');
    this.cerrarPanel();
    this.recargar();
  }

  /** Arrastrar un nodo guarda su nueva posición (y su lane, si cambió). */
  alMover(movimiento: MovimientoNodo): void {
    const detalle = this.detalle();
    if (!detalle || !this.editable()) return;

    const peticion = this.peticionMovimiento(detalle, movimiento);
    if (!peticion) return;

    this.limpiarAvisos();
    peticion.subscribe({
      next: mensaje => {
        if (mensaje) this.mensaje.set(mensaje);
        this.recargar();
      },
      error: (error: HttpErrorResponse) => {
        this.errorAccion.set(mensajeApi(error));
        this.recargar();
      }
    });
  }

  private peticionMovimiento(detalle: ProcesoDetalle, movimiento: MovimientoNodo): Observable<string | null> | null {
    const { posicionX, posicionY } = movimiento;

    if (movimiento.tipo === 'ACTIVIDAD') {
      const actividad = detalle.actividades.find(a => a.id === movimiento.id);
      if (!actividad) return null;
      const laneId = movimiento.laneId ?? actividad.laneId;
      const nuevaLane = detalle.lanes.find(l => l.id === laneId)?.nombre;

      return this.actividadService
        .editar(detalle.id, actividad.id, { nombre: actividad.nombre, tipo: actividad.tipo, laneId, posicionX, posicionY })
        .pipe(map(() => laneId !== actividad.laneId
          ? `La actividad "${actividad.nombre}" ahora es responsabilidad de "${nuevaLane}".`
          : null));
    }

    if (movimiento.tipo === 'GATEWAY') {
      const gateway = detalle.gateways.find(g => g.id === movimiento.id);
      if (!gateway || gateway.poolId == null) return null;
      return this.gatewayService
        .editar(detalle.id, gateway.id, { tipo: gateway.tipo, poolId: gateway.poolId, posicionX, posicionY })
        .pipe(map(() => null));
    }

    const evento = detalle.eventosMensaje.find(e => e.id === movimiento.id);
    if (!evento) return null;
    return this.eventoService
      .editar(detalle.id, evento.id, eventoARequest(evento, { laneId: movimiento.laneId, posicionX, posicionY }))
      .pipe(map(() => null));
  }

  limpiarAvisos(): void {
    this.mensaje.set('');
    this.advertencias.set([]);
    this.errorAccion.set('');
  }

  private recargar(): void {
    this.cargar();
    if (this.pestana() === 'historial') {
      this.cargarHistorial();
    }
  }

  private buscar<T extends { id: number }>(tipo: TipoElemento, lista: (detalle: ProcesoDetalle) => T[]): T | null {
    const seleccion = this.seleccion();
    const detalle = this.detalle();
    if (!detalle || seleccion?.tipo !== tipo) return null;
    return lista(detalle).find(elemento => elemento.id === seleccion.id) ?? null;
  }

  /** Tras recargar, si el elemento seleccionado ya no existe se cierra su panel. */
  private descartarSeleccionInexistente(): void {
    const seleccion = this.seleccion();
    if (!seleccion) return;
    const existe = [
      this.poolSeleccionado(), this.laneSeleccionada(), this.actividadSeleccionada(), this.gatewaySeleccionado(),
      this.arcoSeleccionado(), this.eventoSeleccionado(), this.flujoSeleccionado()
    ].some(elemento => elemento !== null);
    if (!existe) {
      this.seleccion.set(null);
    }
  }
}
