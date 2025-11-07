import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

import { Funcionario } from '../../models/funcionario.model';
import { BaterPontoResponse } from '../../models/ponto.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, DatePipe],
})
export class PortalComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  employee = signal<Funcionario | null>(null);
  lastActionMessage = signal('');
  readonly lastActionTime = new Date();
  
  private readonly colors = [
    'bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-pink-500'
  ];

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { response: BaterPontoResponse; message: string; } | undefined;

    // Handle one-time message from PIN pad after clocking in
    if (state?.message) {
      this.lastActionMessage.set(state.message);
    } else {
      // On refresh or direct navigation, show a generic welcome message
      this.lastActionMessage.set('Bem-vindo(a) de volta!');
    }
    
    // Fetch employee data using ID from the URL to be resilient
    const employeeId = this.route.snapshot.paramMap.get('id');
    if (employeeId) {
      this.apiService.getFuncionarioById(employeeId).subscribe(emp => {
        if (emp) {
          this.employee.set(emp);
        } else {
          // If employee not found for some reason, log out.
          this.authService.logout();
        }
      });
    } else {
      // If no ID is present, log out.
      this.authService.logout();
    }
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

  private navigateWithState(path: string): void {
    if (this.employee()) {
      this.router.navigate([path, this.employee()!.id], {
        state: { employee: this.employee() }
      });
    }
  }

  baterPonto(): void {
    this.navigateWithState('/pin');
  }

  viewTimeSheet(): void {
    this.navigateWithState('/espelho-ponto');
  }

  viewEscala(): void {
    this.navigateWithState('/escala');
  }

  viewHolerite(): void {
    this.navigateWithState('/holerite');
  }
  
  logout(): void {
    this.authService.logout();
  }
}