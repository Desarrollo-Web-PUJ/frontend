import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';
import { Login } from './pages/login/login.component';

const EDITORES = { roles: ['ADMINISTRADOR', 'EDITOR'] };
const ADMINISTRADORES = { roles: ['ADMINISTRADOR'] };

// Las pantallas se cargan solo cuando el usuario las visita (lazy loading)
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, title: 'Iniciar sesión' },
  {
    path: 'registro',
    title: 'Registrar empresa',
    loadComponent: () => import('./pages/registro-empresa/registro-empresa.component').then(m => m.RegistroEmpresa)
  },
  {
    // Área privada: una sola verificación de sesión para todas las pantallas hijas
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/layout/layout.component').then(m => m.Layout),
    children: [
      {
        path: 'procesos',
        title: 'Procesos',
        loadComponent: () => import('./pages/procesos/procesos.component').then(m => m.Procesos)
      },
      {
        path: 'procesos/nuevo',
        title: 'Crear proceso',
        canActivate: [rolGuard],
        data: EDITORES,
        loadComponent: () => import('./pages/proceso-form/proceso-form.component').then(m => m.ProcesoForm)
      },
      {
        path: 'procesos/:id/editar',
        title: 'Editar proceso',
        canActivate: [rolGuard],
        data: EDITORES,
        loadComponent: () => import('./pages/proceso-form/proceso-form.component').then(m => m.ProcesoForm)
      },
      {
        path: 'procesos/:id',
        title: 'Diagrama del proceso',
        loadComponent: () => import('./pages/proceso-detalle/proceso-detalle.component').then(m => m.ProcesoDetallePage)
      },
      {
        path: 'compartidos',
        title: 'Procesos compartidos conmigo',
        loadComponent: () => import('./pages/compartidos/compartidos.component').then(m => m.Compartidos)
      },
      {
        path: 'roles',
        title: 'Roles de proceso',
        loadComponent: () => import('./pages/roles-proceso/roles-proceso.component').then(m => m.RolesProceso)
      },
      {
        path: 'usuarios',
        title: 'Usuarios de la empresa',
        canActivate: [rolGuard],
        data: ADMINISTRADORES,
        loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.Usuarios)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
