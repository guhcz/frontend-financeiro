import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';
const THEME_KEY = 'meufinanceiro.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<AppTheme>(this.readTheme());

  constructor() {
    this.applyToDocument(this.theme());
  }

  preview(theme: AppTheme): void {
    this.theme.set(theme);
    this.applyToDocument(theme);
  }

  save(theme: AppTheme): void {
    this.preview(theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  private readTheme(): AppTheme {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  }

  private applyToDocument(theme: AppTheme): void {
    this.document.documentElement.dataset['theme'] = theme;
  }
}
