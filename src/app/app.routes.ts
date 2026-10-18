

import { Routes } from '@angular/router';

import { Login } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';

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
  {
    path: '**',
    redirectTo: 'login'
  }
];
