

import { Routes } from '@angular/router';

import { Login } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'procesos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/procesos/procesos.component')
        .then(m => m.Procesos)
  },
  // Las rutas nuevas cargan su pantalla solo cuando el usuario la visita.
  {
    path: 'usuarios',
    canActivate: [authGuard, rolGuard],
    data: { roles: ['ADMINISTRADOR'] },
    loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.Usuarios)
  },
  {
    path: 'procesos/nuevo',
    canActivate: [authGuard, rolGuard],
    data: { roles: ['ADMINISTRADOR', 'EDITOR'] },
    loadComponent: () => import('./pages/proceso-form/proceso-form.component').then(m => m.ProcesoForm)
  },
  {
    path: 'procesos/:id/editar',
    canActivate: [authGuard, rolGuard],
    data: { roles: ['ADMINISTRADOR', 'EDITOR'] },
    loadComponent: () => import('./pages/proceso-form/proceso-form.component').then(m => m.ProcesoForm)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
