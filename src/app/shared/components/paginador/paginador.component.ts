import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Controles de paginación reutilizables.
 * Recibe la página actual (base 0) y el total; emite la página solicitada.
 */
@Component({
  selector: 'app-paginador',
  templateUrl: './paginador.component.html',
  styleUrl: './paginador.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Paginador {

  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly deshabilitado = input(false);
  readonly etiqueta = input('Paginación');

  readonly cambiar = output<number>();

  readonly hayAnterior = computed(() => this.pagina() > 0);
  readonly haySiguiente = computed(() => this.pagina() + 1 < this.totalPaginas());

  anterior(): void {
    if (this.hayAnterior() && !this.deshabilitado()) {
      this.cambiar.emit(this.pagina() - 1);
    }
  }

  siguiente(): void {
    if (this.haySiguiente() && !this.deshabilitado()) {
      this.cambiar.emit(this.pagina() + 1);
    }
  }
}
