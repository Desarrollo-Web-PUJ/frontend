import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { ProcesoCompartido } from '../../models/proceso.model';
import { ComparticionService } from '../../services/comparticion.service';
import { mensajeApi } from '../../shared/error-api';

/** HU-23: procesos de otras empresas compartidos con la mía, en solo lectura. */
@Component({
  selector: 'app-compartidos',
  imports: [RouterLink, DatePipe],
  templateUrl: './compartidos.component.html',
  styleUrl: '../../shared/gestion.css'
})
export class Compartidos implements OnInit {

  private readonly servicio = inject(ComparticionService);

  readonly procesos = signal<ProcesoCompartido[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.compartidosConmigo()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: procesos => this.procesos.set(procesos),
        error: error => this.error.set(mensajeApi(error))
      });
  }
}
