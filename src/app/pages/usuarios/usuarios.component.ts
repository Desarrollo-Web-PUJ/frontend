import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { RolUsuario } from '../../models/auth.model';
import { UsuarioResponse } from '../../models/usuario.model';
import { mensajeApi } from '../../shared/error-api';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './usuarios.component.html',
  styleUrl: '../../shared/gestion.css'
})
export class Usuarios implements OnInit {
  readonly auth = inject(AuthService);
  private readonly servicio = inject(UsuarioService);
  readonly usuarios = signal<UsuarioResponse[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly errorCarga = signal('');
  readonly mensaje = signal('');
  readonly pendiente = signal<UsuarioResponse | null>(null);
  readonly roles: { valor: RolUsuario; nombre: string }[] = [
    { valor: 'ADMINISTRADOR', nombre: 'Administrador' },
    { valor: 'EDITOR', nombre: 'Editor' },
    { valor: 'LECTURA', nombre: 'Solo lectura' }
  ];
  readonly rolesElegidos = new Map<number, RolUsuario>();
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.pattern(/\S/)] }),
    rol: new FormControl<RolUsuario>('LECTURA', { nonNullable: true, validators: Validators.required })
  });

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    const empresaId = this.auth.usuario()?.empresaId;
    if (!empresaId) return;
    this.cargando.set(true);
    this.errorCarga.set('');
    this.servicio.listar(empresaId).pipe(finalize(() => this.cargando.set(false))).subscribe({
      next: usuarios => {
        this.usuarios.set(usuarios);
        this.rolesElegidos.clear();
      },
      error: error => this.errorCarga.set(mensajeApi(error))
    });
  }

  registrar(): void {
    if (this.guardando()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const empresaId = this.auth.usuario()?.empresaId;
    if (!empresaId) return;
    const datos = this.form.getRawValue();
    this.ejecutar(this.servicio.registrar(empresaId, {
      ...datos, nombre: datos.nombre.trim(), correo: datos.correo.trim()
    }), 'Colaborador registrado correctamente.', true);
  }

  elegirRol(id: number, valor: string): void {
    if (this.roles.some(rol => rol.valor === valor)) this.rolesElegidos.set(id, valor as RolUsuario);
  }

  cambiarRol(usuario: UsuarioResponse): void {
    const empresaId = this.auth.usuario()?.empresaId;
    const rol = this.rolesElegidos.get(usuario.id);
    if (!empresaId || !rol || rol === usuario.rol || this.guardando()) return;
    this.ejecutar(this.servicio.cambiarRol(empresaId, usuario.id, rol), 'Rol actualizado correctamente. Se aplicará en el próximo inicio de sesión del colaborador.');
  }

  desactivar(): void {
    const empresaId = this.auth.usuario()?.empresaId;
    const usuario = this.pendiente();
    if (!empresaId || !usuario || this.guardando()) return;
    this.ejecutar(this.servicio.desactivar(empresaId, usuario.id), 'Colaborador desactivado correctamente.');
  }

  private ejecutar(peticion: Observable<UsuarioResponse>, mensaje: string, limpiar = false): void {
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        this.pendiente.set(null);
        this.mensaje.set(mensaje);
        if (limpiar) this.form.reset({ nombre: '', correo: '', password: '', rol: 'LECTURA' });
        this.cargar();
      },
      error: error => this.error.set(mensajeApi(error))
    });
  }
}
