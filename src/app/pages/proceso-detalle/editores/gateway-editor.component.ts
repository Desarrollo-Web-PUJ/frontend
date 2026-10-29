import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TIPOS_GATEWAY } from '../../../models/diagrama.model';
import type { Gateway, GatewayRequest, TipoGateway } from '../../../models/diagrama.model';
import { GatewayService } from '../../../services/gateway.service';
import { Aviso } from '../../../shared/components/aviso/aviso.component';
import { DialogoConfirmacion } from '../../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { siguientePosicionX } from '../diagrama/diagrama-layout';
import { EditorBase } from './editor-base';

/**
 * HU-14 a HU-16: gateways. El tipo determina el símbolo y las reglas de los
 * arcos de salida (con condición en exclusivo e inclusivo, sin ella en paralelo).
 */
@Component({
  selector: 'app-gateway-editor',
  imports: [ReactiveFormsModule, Aviso, DialogoConfirmacion],
  templateUrl: './gateway-editor.component.html',
  styleUrl: './editor.css'
})
export class GatewayEditor extends EditorBase {

  private readonly servicio = inject(GatewayService);

  readonly gateway = input<Gateway | null>(null);

  readonly tipos = Object.entries(TIPOS_GATEWAY) as [TipoGateway, string][];
  readonly poolsPropios = computed(() => this.detalle().pools.filter(pool => pool.tipo === 'PROPIO'));

  readonly arcosSalientes = computed(() => {
    const gateway = this.gateway();
    return gateway
      ? this.detalle().arcos.filter(arco => arco.tipoOrigen === 'GATEWAY' && arco.origenId === gateway.id).length
      : 0;
  });

  readonly form = new FormGroup({
    tipo: new FormControl<TipoGateway>('EXCLUSIVO', { nonNullable: true }),
    poolId: new FormControl<number | null>(null, { validators: Validators.required })
  });

  constructor() {
    super();
    effect(() => {
      const gateway = this.gateway();
      const poolInicial = gateway?.poolId ?? this.poolsPropios()[0]?.id ?? null;
      untracked(() => this.form.reset({ tipo: gateway?.tipo ?? 'EXCLUSIVO', poolId: poolInicial }));
    });
  }

  guardar(): void {
    this.form.markAllAsTouched();
    const { tipo, poolId } = this.form.getRawValue();
    if (this.form.invalid || poolId == null) return;

    const detalle = this.detalle();
    const gateway = this.gateway();
    const conservaPosicion = gateway != null && gateway.poolId === poolId;

    const datos: GatewayRequest = {
      tipo,
      poolId,
      posicionX: conservaPosicion ? gateway.posicionX : siguientePosicionX(detalle, poolId),
      posicionY: conservaPosicion ? gateway.posicionY : null
    };

    if (gateway) {
      this.ejecutar(this.servicio.editar(detalle.id, gateway.id, datos), respuesta => ({
        mensaje: `Gateway #${gateway.id} actualizado a ${respuesta.gateway.tipo.toLowerCase()}.`,
        advertencias: respuesta.advertencias
      }));
    } else {
      this.ejecutar(this.servicio.crear(detalle.id, datos), creado => ({
        mensaje: `Gateway ${creado.tipo.toLowerCase()} #${creado.id} creado. Conecta al menos dos arcos de salida.`,
        advertencias: []
      }));
    }
  }

  eliminar(): void {
    const gateway = this.gateway();
    if (!gateway) return;
    this.ejecutar(this.servicio.eliminar(this.detalle().id, gateway.id), respuesta => ({
      mensaje: `Gateway #${gateway.id} eliminado junto con ${respuesta.arcosEliminados} arco(s).`,
      advertencias: respuesta.advertencias
    }));
  }
}
