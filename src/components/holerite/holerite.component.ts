import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { Funcionario } from '../../models/funcionario.model';
import { ApiService } from '../../services/api.service';
import { FolhaPagamentoFuncionario } from '../../models/folha-pagamento.model';

@Component({
  selector: 'app-holerite',
  templateUrl: './holerite.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, CurrencyPipe],
})
export class HoleriteComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  employee = signal<Funcionario | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  payslip = signal<FolhaPagamentoFuncionario | null>(null);
  
  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());

  months = signal([
    { value: 1, name: 'Janeiro' }, { value: 2, name: 'Fevereiro' },
    { value: 3, name: 'Março' }, { value: 4, name: 'Abril' },
    { value: 5, name: 'Maio' }, { value: 6, name: 'Junho' },
    { value: 7, name: 'Julho' }, { value: 8, name: 'Agosto' },
    { value: 9, name: 'Setembro' }, { value: 10, name: 'Outubro' },
    { value: 11, name: 'Novembro' }, { value: 12, name: 'Dezembro' }
  ]);

  years = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  });

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const employeeFromState = navigation?.extras.state?.['employee'] as Funcionario | undefined;
    
    if (employeeFromState) {
      this.employee.set(employeeFromState);
    } else {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
      this.loadHolerite();
  }

  loadHolerite(): void {
    if (!this.employee()) return;

    this.loading.set(true);
    this.error.set(null);
    this.payslip.set(null);

    const mes = this.selectedMonth().toString().padStart(2, '0');
    const ano = this.selectedYear().toString();
    
    this.apiService.getFolhaPagamento(mes, ano)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          const employeePayslip = response.empleados.find(e => e.employeeId === this.employee()!.id);
          this.payslip.set(employeePayslip || null);
        },
        error: (err) => this.error.set(err.message || 'Falha ao carregar o holerite.'),
      });
  }
  
  onMonthChange(event: Event): void {
    this.selectedMonth.set(Number((event.target as HTMLSelectElement).value));
  }

  onYearChange(event: Event): void {
    this.selectedYear.set(Number((event.target as HTMLSelectElement).value));
  }
}
