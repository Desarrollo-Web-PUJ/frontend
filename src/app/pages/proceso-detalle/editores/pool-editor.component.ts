import { Component, effect, inject, input, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import type { Pool, TipoPool } from '../../../models/diagrama.model';
import { PoolService } from '../../../services/pool.service';
import { Aviso } from '../../../shared/components/aviso/aviso.component';
import { DialogoConfirmacion } from '../../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { noVacio } from '../../../shared/validadores';
import { EditorBase } from './editor-base';

/** HU-21: participantes del proceso (pool propio o participante externo / caja negra). */
@Component({
  selector: 'app-pool-editor',
  imports: [ReactiveFormsModule, Aviso, DialogoConfirmacion],
  templateUrl: './pool-editor.component.html',
  styleUrl: './editor.css'
})
export class PoolEditor extends EditorBase {

  private readonly servicio = inject(PoolService);

  readonly pool = input<Pool | null>(null);

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, noVacio] }),
    tipo: new FormControl<TipoPool>('EXTERNO', { nonNullable: true })
  });

  constructor() {
    super();
    effect(() => {
      const pool = this.pool();
      untracked(() => this.form.reset(pool ? { nombre: pool.nombre, tipo: pool.tipo } : { nombre: '', tipo: 'EXTERNO' }));
    });
  }

  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const datos = { nombre: this.form.controls.nombre.value.trim(), tipo: this.form.controls.tipo.value };
    const procesoId = this.detalle().id;
    const pool = this.pool();

    this.ejecutar(
      pool ? this.servicio.editar(procesoId, pool.id, datos) : this.servicio.crear(procesoId, datos),
      guardado => ({ mensaje: `Pool "${guardado.nombre}" ${pool ? 'actualizado' : 'creado'}.`, advertencias: [] })
    );
  }

  eliminar(): void {
    const pool = this.pool();
    if (!pool) return;
    this.ejecutar(this.servicio.eliminar(this.detalle().id, pool.id), respuesta => respuesta);
  }
}
