import { Component, computed, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import type { Lane } from '../../../models/diagrama.model';
import type { RolProceso } from '../../../models/rol-proceso.model';
import { LaneService } from '../../../services/lane.service';
import { PoolService } from '../../../services/pool.service';
import { Aviso } from '../../../shared/components/aviso/aviso.component';
import { DialogoConfirmacion } from '../../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { mensajeApi } from '../../../shared/error-api';
import { EditorBase } from './editor-base';

/**
 * HU-22 y HU-24: lanes del pool. Cada lane se nombra con un rol de proceso
 * de la empresa; solo se ofrecen los roles disponibles para el pool.
 */
@Component({
  selector: 'app-lane-editor',
  imports: [ReactiveFormsModule, Aviso, DialogoConfirmacion],
  templateUrl: './lane-editor.component.html',
  styleUrl: './editor.css'
})
export class LaneEditor extends EditorBase {

  private readonly laneService = inject(LaneService);
  private readonly poolService = inject(PoolService);
  private readonly destroyRef = inject(DestroyRef);

  readonly lane = input<Lane | null>(null);

  readonly roles = signal<RolProceso[]>([]);
  readonly cargandoRoles = signal(false);

  readonly poolsPropios = computed(() => this.detalle().pools.filter(pool => pool.tipo === 'PROPIO'));

  /** Lanes del mismo pool, en orden, para poder subir o bajar la lane actual. */
  readonly lanesDelPool = computed(() => {
    const lane = this.lane();
    if (!lane) return [];
    return this.detalle().lanes
      .filter(l => l.poolId === lane.poolId)
      .sort((a, b) => a.orden - b.orden);
  });
  readonly posicion = computed(() => this.lanesDelPool().findIndex(l => l.id === this.lane()?.id));

  readonly form = new FormGroup({
    poolId: new FormControl<number | null>(null, { validators: Validators.required }),
    rolProcesoId: new FormControl<number | null>(null, { validators: Validators.required })
  });

  constructor() {
    super();
    effect(() => {
      const lane = this.lane();
      const poolInicial = lane?.poolId ?? this.poolsPropios()[0]?.id ?? null;
      untracked(() => {
        this.form.reset({ poolId: poolInicial, rolProcesoId: lane?.rolProcesoId ?? null });
        // El pool de una lane existente no cambia: sus actividades pertenecen a ese pool
        if (lane) {
          this.form.controls.poolId.disable();
        } else {
          this.form.controls.poolId.enable();
        }
        this.cargarRoles(poolInicial);
      });
    });

    this.form.controls.poolId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(poolId => this.cargarRoles(poolId));
  }

  cargarRoles(poolId: number | null): void {
    this.roles.set([]);
    if (poolId == null) return;

    this.cargandoRoles.set(true);
    this.poolService.rolesDisponibles(this.detalle().id, poolId).subscribe({
      next: roles => {
        this.roles.set(roles);
        this.cargandoRoles.set(false);
      },
      error: error => {
        this.cargandoRoles.set(false);
        this.error.set(mensajeApi(error));
      }
    });
  }

  guardar(): void {
    this.form.markAllAsTouched();
    const { poolId, rolProcesoId } = this.form.getRawValue();
    if (this.form.invalid || poolId == null || rolProcesoId == null) return;

    const procesoId = this.detalle().id;
    const lane = this.lane();

    this.ejecutar(
      lane
        ? this.laneService.editar(procesoId, poolId, lane.id, { rolProcesoId })
        : this.laneService.crear(procesoId, poolId, { rolProcesoId }),
      guardada => ({ mensaje: `Lane "${guardada.nombre}" ${lane ? 'actualizada' : 'creada'}.`, advertencias: [] })
    );
  }

  mover(desplazamiento: -1 | 1): void {
    const lane = this.lane();
    const lanes = [...this.lanesDelPool()];
    const actual = this.posicion();
    const destino = actual + desplazamiento;
    if (!lane || lane.poolId == null || actual < 0 || destino < 0 || destino >= lanes.length) return;

    [lanes[actual], lanes[destino]] = [lanes[destino], lanes[actual]];
    this.ejecutar(
      this.laneService.reordenar(this.detalle().id, lane.poolId, lanes.map(l => l.id)),
      () => ({ mensaje: `Lane "${lane.nombre}" movida ${desplazamiento < 0 ? 'hacia arriba' : 'hacia abajo'}.`, advertencias: [] })
    );
  }

  eliminar(): void {
    const lane = this.lane();
    if (!lane || lane.poolId == null) return;
    this.ejecutar(this.laneService.eliminar(this.detalle().id, lane.poolId, lane.id), respuesta => respuesta);
  }
}
