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
      { path: '', redirectTo: 'despesas', pathMatch: 'full' },
      {
        path: 'despesas',
        loadComponent: () =>
          import('./features/expenses/expense-list/expense-list').then((m) => m.ExpenseList),
      },
      {
        path: 'despesas-fixas',
        loadComponent: () =>
          import('./features/recurring-expenses/recurring-expense-list/recurring-expense-list').then(
            (m) => m.RecurringExpenseList,
          ),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/categories/category-list/category-list').then((m) => m.CategoryList),
      },
      {
        path: 'limite-mensal',
        loadComponent: () =>
          import('./features/monthly-limits/monthly-limit-list/monthly-limit-list').then(
            (m) => m.MonthlyLimitList,
          ),
      },
      {
        path: 'planejamento',
        loadComponent: () =>
          import('./features/planning/planning-page/planning-page').then((m) => m.PlanningPage),
      },
    ],
  },
  { path: '**', redirectTo: 'despesas' },
];
