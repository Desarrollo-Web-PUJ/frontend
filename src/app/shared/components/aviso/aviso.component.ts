import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type TipoAviso = 'exito' | 'error' | 'advertencia' | 'info';

/**
 * Mensaje de estado reutilizable: éxito, error, advertencias de coherencia del
 * diagrama o información. Acepta un texto o una lista de textos.
 */
@Component({
  selector: 'app-aviso',
  templateUrl: './aviso.component.html',
  styleUrl: './aviso.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Aviso {

  readonly tipo = input<TipoAviso>('info');
  readonly titulo = input<string | null>(null);
  readonly mensajes = input.required<string | string[]>();
  readonly descartable = input(false);

  readonly descartar = output<void>();

  readonly lista = computed(() => {
    const valor = this.mensajes();
    return Array.isArray(valor) ? valor : [valor];
  });

  readonly rol = computed(() => this.tipo() === 'error' ? 'alert' : 'status');
}
