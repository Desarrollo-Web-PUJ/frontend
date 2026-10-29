import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Confirmación previa a una acción destructiva (eliminar, desactivar...).
 * Las HU exigen confirmar antes de eliminar; este componente lo resuelve
 * en un solo lugar para todas las pantallas.
 */
@Component({
  selector: 'app-dialogo-confirmacion',
  templateUrl: './dialogo-confirmacion.component.html',
  styleUrl: './dialogo-confirmacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogoConfirmacion {

  readonly mensaje = input.required<string>();
  readonly detalle = input<string | null>(null);
  readonly textoConfirmar = input('Confirmar');
  readonly ocupado = input(false);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
