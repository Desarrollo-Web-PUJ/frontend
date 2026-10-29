import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { EmpresaService } from '../../services/empresa.service';
import { mensajeApi } from '../../shared/error-api';
import { camposIguales, noVacio } from '../../shared/validadores';

type CampoRegistro =
  | 'nombre'
  | 'nit'
  | 'correoContacto'
  | 'adminNombre'
  | 'adminCorreo'
  | 'adminPassword'
  | 'confirmarPassword';

/**
 * HU-01: registro de la empresa como espacio independiente y creación
 * de su usuario administrador inicial.
 */
@Component({
  selector: 'app-registro-empresa',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro-empresa.component.html',
  styleUrls: ['../../shared/gestion.css', './registro-empresa.component.css']
})
export class RegistroEmpresa {

  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);

  readonly guardando = signal(false);
  readonly error = signal('');

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, noVacio] }),
    nit: new FormControl('', { nonNullable: true, validators: [Validators.required, noVacio] }),
    correoContacto: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    adminNombre: new FormControl('', { nonNullable: true, validators: [Validators.required, noVacio] }),
    adminCorreo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    adminPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    confirmarPassword: new FormControl('', { nonNullable: true, validators: Validators.required })
  }, { validators: camposIguales('adminPassword', 'confirmarPassword') });

  invalido(campo: CampoRegistro): boolean {
    const control = this.form.controls[campo];
    return control.touched && control.invalid;
  }

  registrar(): void {
    if (this.guardando()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { confirmarPassword: _, ...datos } = this.form.getRawValue();
    this.error.set('');
    this.guardando.set(true);

    this.empresaService.registrar({
      ...datos,
      nombre: datos.nombre.trim(),
      nit: datos.nit.trim(),
      correoContacto: datos.correoContacto.trim(),
      adminNombre: datos.adminNombre.trim(),
      adminCorreo: datos.adminCorreo.trim()
    }).pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/login'], {
          state: { registro: true, correo: datos.adminCorreo.trim() }
        }),
        error: error => this.error.set(mensajeApi(error))
      });
  }
}
