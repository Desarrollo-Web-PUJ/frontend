
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class Login {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly mensaje = signal('');

  readonly form = new FormGroup({
    correo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email
      ]
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

    const datos = this.form.getRawValue();

    this.authService.login({
      correo: datos.correo,
      password: datos.contrasena
    }).subscribe({

      next: (respuesta) => {
        console.log(
          'Usuario autenticado:',
          respuesta.nombre,
          respuesta.rol
        );

        void this.router.navigate(['/procesos']);
      },

      error: (error: HttpErrorResponse) => {
        if (error.status === 0 || error.status === 502) {
          this.mensaje.set(
            'No se pudo conectar con el backend.'
          );
        } else if (
          error.status === 400 ||
          error.status === 401 ||
          error.status === 403
        ) {
          this.mensaje.set(
            'Correo o contraseña incorrectos.'
          );
        } else {
          this.mensaje.set(
            'Ocurrio un error al iniciar sesion.'
          );
        }
      }
    });
  }
}



