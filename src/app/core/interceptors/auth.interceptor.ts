import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  const isAuthRequest = req.url.endsWith('/auth/login') || req.url.endsWith('/auth/refresh');
  if (isAuthRequest) {
    return next(req);
  }

  const expireSession = () => {
    if (authService.expireSession()) {
      notificationService.info('Sessão expirada. Faça login novamente.');
    }
  };

  const withToken = (token: string) => req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  const refreshAndRetry = () =>
    authService.refreshSession().pipe(
      catchError((refreshError: unknown) => {
        expireSession();
        return throwError(() => refreshError);
      }),
      switchMap((newToken) =>
        next(withToken(newToken)).pipe(
          catchError((retryError: unknown) => {
            if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
              expireSession();
            }
            return throwError(() => retryError);
          }),
        ),
      ),
    );

  const token = authService.token;
  if (!token && authService.canRefresh) {
    return refreshAndRetry();
  }

  const authedReq = token ? withToken(token) : req;

  return next(authedReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        if (err.error?.code === 'TOKEN_EXPIRED' && authService.canRefresh) {
          return refreshAndRetry();
        }
        expireSession();
      }
      return throwError(() => err);
    }),
  );
};
