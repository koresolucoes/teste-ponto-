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
  
  private readonly colors = [
    'bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-pink-500'
  ];

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

    // Client-side PIN validation based on fetched employee data
    if (this.pin() !== this.employee()!.pin) {
      this.status.set('error');
      this.message.set('PIN incorreto. Tente novamente.');
      this.pin.set('');
      return;
    }

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
          // Since PIN is validated on the client, this error is likely a communication or server issue.
          this.message.set('Falha na comunicação. Tente novamente.');
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
