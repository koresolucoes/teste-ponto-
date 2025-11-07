import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

import { Funcionario } from '../../models/funcionario.model';
import { BaterPontoResponse } from '../../models/ponto.model';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, DatePipe],
})
export class PortalComponent {
  private readonly router = inject(Router);

  employee = signal<Funcionario | null>(null);
  lastActionMessage = signal('');
  readonly lastActionTime = new Date();
  
  private readonly colors = [
    'bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-pink-500'
  ];

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { employee: Funcionario; response: BaterPontoResponse; message: string; } | undefined;

    if (state?.employee && state?.response && state?.message) {
      this.employee.set(state.employee);
      this.lastActionMessage.set(state.message);
    } else {
      // If state is lost, navigate to employee selection
      this.router.navigate(['/']);
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
}
