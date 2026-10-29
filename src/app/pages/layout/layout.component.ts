import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../services/auth.service';

const NOMBRES_ROL = {
  ADMINISTRADOR: 'Administrador',
  EDITOR: 'Editor',
  LECTURA: 'Solo lectura'
} as const;

/**
 * Estructura común de las pantallas autenticadas: barra de navegación
 * (según el rol de acceso) y el contenido de la ruta activa.
 */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Layout {

  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly cerrandoSesion = signal(false);
  readonly errorLogout = signal('');

  readonly nombreRol = computed(() => {
    const rol = this.auth.usuario()?.rol;
    return rol ? NOMBRES_ROL[rol] : '';
  });

  cerrarSesion(): void {
    if (this.cerrandoSesion()) return;
    this.cerrandoSesion.set(true);
    this.errorLogout.set('');

    this.auth.logout().subscribe({
      next: () => {
        this.cerrandoSesion.set(false);
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.cerrandoSesion.set(false);
        this.errorLogout.set('No se pudo cerrar la sesión. Intenta nuevamente.');
      }
    });
  }
}
