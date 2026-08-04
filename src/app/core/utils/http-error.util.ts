import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api-error.model';

const GENERIC_ERROR = 'Ocorreu um erro inesperado. Tente novamente.';
const SERVER_ERROR = 'Erro do servidor. Tente novamente mais tarde.';

function isApiError(body: unknown): body is ApiError {
  return !!body && typeof body === 'object' && 'detail' in body && typeof (body as ApiError).detail === 'string';
}

export function getErrorDetail(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (isApiError(err.error)) {
      return err.error.detail;
    }
    if (err.status === 0 || err.status >= 500) {
      return SERVER_ERROR;
    }
  }
  return GENERIC_ERROR;
}
