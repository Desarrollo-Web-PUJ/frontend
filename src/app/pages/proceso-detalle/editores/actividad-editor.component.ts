import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TIPOS_ACTIVIDAD } from '../../../models/diagrama.model';
import type { Actividad, ActividadRequest, TipoActividad } from '../../../models/diagrama.model';
import { ActividadService } from '../../../services/actividad.service';
import { Aviso } from '../../../shared/components/aviso/aviso.component';
import { DialogoConfirmacion } from '../../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { noVacio } from '../../../shared/validadores';
import { siguientePosicionX } from '../diagrama/diagrama-layout';
import { EditorBase } from './editor-base';

/**
 * HU-08 a HU-10: actividades. La lane elegida define el rol responsable;
 * cambiarla mueve la actividad a la banda del nuevo rol.
 */
@Component({
  selector: 'app-actividad-editor',
  imports: [ReactiveFormsModule, Aviso, DialogoConfirmacion],
  templateUrl: './actividad-editor.component.html',
  styleUrl: './editor.css'
})
export class ActividadEditor extends EditorBase {

  private readonly servicio = inject(ActividadService);

  readonly actividad = input<Actividad | null>(null);

  readonly tipos = Object.entries(TIPOS_ACTIVIDAD) as [TipoActividad, string][];

  /** Lanes agrupadas por pool propio, para el <select> con optgroup. */
  readonly gruposLanes = computed(() => {
    const detalle = this.detalle();
    return detalle.pools
      .filter(pool => pool.tipo === 'PROPIO')
      .map(pool => ({
        pool,
        lanes: detalle.lanes.filter(lane => lane.poolId === pool.id).sort((a, b) => a.orden - b.orden)
      }))
      .filter(grupo => grupo.lanes.length > 0);
  });

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, noVacio] }),
    tipo: new FormControl<TipoActividad>('TAREA_USUARIO', { nonNullable: true }),
    laneId: new FormControl<number | null>(null, { validators: Validators.required })
  });

  constructor() {
    super();
    effect(() => {
      const actividad = this.actividad();
      const primeraLane = this.gruposLanes()[0]?.lanes[0]?.id ?? null;
      untracked(() => this.form.reset({
        nombre: actividad?.nombre ?? '',
        tipo: actividad?.tipo ?? 'TAREA_USUARIO',
        laneId: actividad?.laneId ?? primeraLane
      }));
    });
  }

  guardar(): void {
    this.form.markAllAsTouched();
    const valores = this.form.getRawValue();
    if (this.form.invalid || valores.laneId == null) return;

    const detalle = this.detalle();
    const actividad = this.actividad();
    const poolDeLane = (laneId: number) => detalle.lanes.find(l => l.id === laneId)?.poolId ?? null;
    const poolNuevo = poolDeLane(valores.laneId);

    // Se conserva la posición; si cambia de pool se ubica al final del nuevo pool
    const conservaPosicion = actividad != null && poolDeLane(actividad.laneId) === poolNuevo;
    const datos: ActividadRequest = {
      nombre: valores.nombre.trim(),
      tipo: valores.tipo,
      laneId: valores.laneId,
      posicionX: conservaPosicion ? actividad.posicionX : siguientePosicionX(detalle, poolNuevo),
      posicionY: conservaPosicion ? actividad.posicionY : null
    };

    this.ejecutar(
      actividad ? this.servicio.editar(detalle.id, actividad.id, datos) : this.servicio.crear(detalle.id, datos),
      guardada => ({
        mensaje: `Actividad "${guardada.nombre}" ${actividad ? 'actualizada' : 'creada'} en la lane "${guardada.laneNombre}".`,
        advertencias: []
      })
    );
  }

  eliminar(): void {
    const actividad = this.actividad();
    if (!actividad) return;
    this.ejecutar(this.servicio.eliminar(this.detalle().id, actividad.id), respuesta => respuesta);
  }
}
