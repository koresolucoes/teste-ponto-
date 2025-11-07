import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Funcionario } from '../../models/funcionario.model';
import { BaterPontoResponse } from '../../models/ponto.model';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class ConfirmationComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  employee = signal<Funcionario | null>(null);
  response = signal<BaterPontoResponse | null>(null);
  message = signal('');
  readonly currentTime = new Date();

  private timeoutId: any;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { employee: Funcionario; response: BaterPontoResponse; message: string; } | undefined;

    if (state?.employee && state?.response && state?.message) {
      this.employee.set(state.employee);
      this.response.set(state.response);
      this.message.set(state.message);
    } else {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.timeoutId = setTimeout(() => {
      this.router.navigate(['/']);
    }, 15000); // 15 seconds timeout
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private navigateTo(path: string): void {
    if (this.employee()) {
      this.router.navigate([path, this.employee()!.id], {
        state: { employee: this.employee() }
      });
    }
  }

  viewTimeSheet(): void {
    this.navigateTo('/espelho-ponto');
  }

  viewEscala(): void {
    this.navigateTo('/escala');
  }

  viewHolerite(): void {
    this.navigateTo('/holerite');
  }
}
