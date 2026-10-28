import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProcesoService } from '../../services/proceso.service';
import { EstadoProceso } from '../../models/proceso.model';
import { mensajeApi } from '../../shared/error-api';

@Component({
  selector: 'app-proceso-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './proceso-form.component.html',
  styleUrl: '../../shared/gestion.css'
})
export class ProcesoForm implements OnInit {
  private readonly servicio = inject(ProcesoService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly id = this.ruta.snapshot.paramMap.get('id');
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly disponible = signal(!this.id);
  readonly error = signal('');
  readonly errorCarga = signal('');

  // El mismo formulario se utiliza para crear y para editar.
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    descripcion: new FormControl('', { nonNullable: true }),
    categoria: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    estado: new FormControl<EstadoProceso>('BORRADOR', { nonNullable: true, validators: Validators.required })
  });

  ngOnInit(): void {
    if (this.id) this.cargar();
  }

  cargar(): void {
    const id = Number(this.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.errorCarga.set('El identificador del proceso no es válido.');
      return;
    }
    this.cargando.set(true);
    this.errorCarga.set('');
    this.servicio.obtener(id).pipe(finalize(() => this.cargando.set(false))).subscribe({
      next: proceso => {
        if (!proceso.activo) {
          this.errorCarga.set('Este proceso está inactivo y no se puede editar.');
          return;
        }
        this.form.patchValue({ ...proceso, descripcion: proceso.descripcion ?? '' });
        this.disponible.set(true);
      },
      error: error => this.errorCarga.set(mensajeApi(error))
    });
  }

  guardar(): void {
    if (this.guardando() || !this.disponible()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.error.set('');
    this.guardando.set(true);
    const valores = this.form.getRawValue();
    const datos = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      categoria: valores.categoria.trim()
    };
    // Al crear, el servidor asigna automáticamente el estado Borrador.
    const peticion = this.id
      ? this.servicio.editar(Number(this.id), { ...datos, estado: valores.estado })
      : this.servicio.crear(datos);
    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => void this.router.navigate(['/procesos'], {
        state: { mensaje: this.id ? 'Proceso actualizado correctamente.' : 'Proceso creado correctamente.' }
      }),
      error: error => this.error.set(mensajeApi(error))
    });
  }
}
