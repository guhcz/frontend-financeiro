import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'movimentacoes',
        loadComponent: () =>
          import('./features/transactions/transaction-list/transaction-list').then((m) => m.TransactionList),
      },
      { path: 'despesas', redirectTo: 'movimentacoes' },
      {
        path: 'planejamento',
        loadComponent: () =>
          import('./features/planning/planning-page/planning-page').then((m) => m.PlanningPage),
      },
      {
        path: 'cadastros',
        loadComponent: () => import('./features/cadastros/cadastros-page/cadastros-page').then((m) => m.CadastrosPage),
      },
      {
        path: 'cadastros/formas-de-pagamento',
        loadComponent: () =>
          import('./features/transaction-methods/transaction-method-list/transaction-method-list').then(
            (m) => m.TransactionMethodList,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
