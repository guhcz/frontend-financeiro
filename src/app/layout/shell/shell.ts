import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { RegisterResponse } from '../../core/models/user.model';
import { ThemeService } from '../../core/services/theme.service';
import { PreferencesModal } from '../../features/preferences/preferences-modal/preferences-modal';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, PreferencesModal],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);

  readonly currentUser = signal<RegisterResponse | null>(null);
  readonly userInitial = computed(() => this.currentUser()?.name.trim().charAt(0).toUpperCase() || 'U');
  readonly userMenuOpen = signal(false);
  readonly preferencesOpen = signal(false);

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => this.currentUser.set(null),
    });
  }

  logout(): void {
    this.authService.logout();
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  openPreferences(): void {
    this.preferencesOpen.set(true);
  }

  closePreferences(): void {
    this.preferencesOpen.set(false);
  }
}
