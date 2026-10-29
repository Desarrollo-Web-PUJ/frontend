import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';

/** HU-03: inicio de sesión. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class Login {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  readonly mensaje = signal('');
  readonly ingresando = signal(false);

  // Avisos que llegan desde otras pantallas (registro exitoso o sesión expirada)
  readonly aviso = signal(this.avisoInicial());

  readonly form = new FormGroup({
    correo: new FormControl(history.state?.correo ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    contrasena: new FormControl('', {
      nonNullable: true,
      validators: Validators.required
    })
  });

  ingresar(): void {
    this.mensaje.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.ingresando()) return;

    const datos = this.form.getRawValue();
    this.ingresando.set(true);

    this.authService.login({ correo: datos.correo.trim(), password: datos.contrasena })
      .pipe(finalize(() => this.ingresando.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/procesos']),
        error: (error: HttpErrorResponse) => this.mensaje.set(this.mensajeError(error))
      });
  }

  private mensajeError(error: HttpErrorResponse): string {
    if (error.status === 0 || error.status === 502) {
      return 'No se pudo conectar con el servidor.';
    }
    // Mensaje genérico: no revela si el correo existe (HU-03)
    if (error.status === 400 || error.status === 401 || error.status === 403) {
      return 'Correo o contraseña incorrectos.';
    }
    return 'Ocurrió un error al iniciar sesión.';
  }

  private avisoInicial(): string {
    if (history.state?.registro) {
      return 'Empresa registrada correctamente. Inicia sesión con la cuenta del administrador.';
    }
    if (this.ruta.snapshot.queryParamMap.get('sesion') === 'expirada') {
      return 'Tu sesión expiró. Inicia sesión nuevamente.';
    }
    return '';
  }
}
