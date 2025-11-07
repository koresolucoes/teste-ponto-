
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { Funcionario } from '../../models/funcionario.model';
import { BaterPontoStatus } from '../../models/ponto.model';

type ViewStatus = 'idle' | 'loading' | 'success' | 'error' | 'fetching';

@Component({
  selector: 'app-pin-pad',
  templateUrl: './pin-pad.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class PinPadComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  employee = signal<Funcionario | null>(null);
  pin = signal('');
  status = signal<ViewStatus>('fetching');
  message = signal('');

  pinDots = computed(() => Array(4).fill(0).map((_, i) => i < this.pin().length));

  keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Limpar', '0', '<'];

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('id');
    if (employeeId) {
      this.loadEmployee(employeeId);
    } else {
      this.router.navigate(['/']);
    }
  }

  loadEmployee(id: string): void {
    this.status.set('fetching');
    this.apiService.getFuncionarioById(id)
      .pipe(finalize(() => this.status.set('idle')))
      .subscribe({
        next: (data) => this.employee.set(data),
        error: () => this.router.navigate(['/']),
      });
  }

  handleKeyPress(key: string): void {
    if (this.status() === 'loading' || this.status() === 'success') return;

    if (/\d/.test(key)) {
      this.pin.update(p => (p.length < 4 ? p + key : p));
    } else if (key === 'Limpar') {
      this.pin.set('');
    } else if (key === '<') {
      this.pin.update(p => p.slice(0, -1));
    }

    if(this.status() === 'error') {
      this.status.set('idle');
      this.message.set('');
    }
  }

  submitPin(): void {
    if (this.pin().length !== 4 || !this.employee()) return;

    this.status.set('loading');
    this.message.set('Processando...');

    const employeeId = this.employee()!.id;
    this.apiService.baterPonto({ employeeId, pin: this.pin() })
      .subscribe({
        next: (response) => {
          this.status.set('success');
          this.message.set(this.getSuccessMessage(response.status));
          setTimeout(() => this.router.navigate(['/']), 2500);
        },
        error: (err) => {
          this.status.set('error');
          this.message.set('PIN incorreto ou falha na comunicação. Tente novamente.');
          this.pin.set('');
        },
      });
  }
  
  private getSuccessMessage(status: BaterPontoStatus): string {
    switch (status) {
      case 'TURNO_INICIADO': return 'Turno iniciado com sucesso!';
      case 'PAUSA_INICIADA': return 'Pausa iniciada.';
      case 'PAUSA_FINALIZADA': return 'Pausa finalizada.';
      case 'TURNO_FINALIZADO': return 'Turno finalizado. Bom descanso!';
      default: return 'Operação realizada com sucesso!';
    }
  }
}
