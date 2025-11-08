import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { Funcionario } from '../../models/funcionario.model';
import { ApiService } from '../../services/api.service';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class EmployeeListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);

  funcionarios = signal<Funcionario[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  isConfigured = this.settingsService.isConfigured;

  private readonly colors = [
    'bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-pink-500'
  ];

  constructor() {
    // This effect is the single source of truth for loading employees.
    // It runs when the app is configured and the user isn't logged in.
    effect(() => {
        if (this.isConfigured() && !this.authService.loggedInEmployeeId()) {
            this.loadFuncionarios();
        } else if (!this.isConfigured()) {
            // If the app is not configured, ensure we are not in a loading state.
            this.loading.set(false);
        }
    });
  }

  ngOnInit(): void {
    // On initialization, the primary concern is redirecting if a session already exists.
    // The effect will handle loading data.
    const loggedInId = this.authService.loggedInEmployeeId();
    if (loggedInId) {
      this.router.navigate(['/portal', loggedInId]);
    }
  }

  loadFuncionarios(): void {
    this.loading.set(true);
    this.error.set(null);
    this.funcionarios.set([]);
    this.apiService.getFuncionarios()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.funcionarios.set(data),
        error: (err) => {
            if (err.message.includes('API não configurada')) {
                 this.error.set('Por favor, configure as credenciais da API para continuar.');
            } else {
                 this.error.set(err.message || 'Falha ao carregar funcionários. Verifique a conexão e as credenciais da API.');
            }
        }
      });
  }

  selectFuncionario(func: Funcionario): void {
    this.router.navigate(['/pin', func.id], { state: { employee: func } });
  }

  getInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return this.colors[0];
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.colors[charCodeSum % this.colors.length];
  }
}
