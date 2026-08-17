import { Component, inject, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AppTheme, ThemeService } from '../../../core/services/theme.service';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-preferences-modal',
  imports: [Modal, LucideAngularModule],
  templateUrl: './preferences-modal.html',
  styleUrl: './preferences-modal.scss',
})
export class PreferencesModal {
  private readonly themeService = inject(ThemeService);
  private readonly originalTheme = this.themeService.theme();
  readonly selectedTheme = signal<AppTheme>(this.originalTheme);
  closed = output<void>();

  selectTheme(theme: AppTheme): void {
    this.selectedTheme.set(theme);
    this.themeService.preview(theme);
  }

  cancel(): void {
    this.themeService.preview(this.originalTheme);
    this.closed.emit();
  }

  save(): void {
    this.themeService.save(this.selectedTheme());
    this.closed.emit();
  }
}
