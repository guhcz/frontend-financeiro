import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../auth-layout.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: unknown) => {
        this.loading.set(false);
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.errorMessage.set('E-mail ou senha inválidos.');
        } else {
          this.errorMessage.set(getErrorDetail(err));
        }
      },
    });
  }
}
