import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { Funcionario } from '../../models/funcionario.model';
import { ApiService } from '../../services/api.service';
import { FolhaPagamentoFuncionario, FolhaPagamentoResponse } from '../../models/folha-pagamento.model';

@Component({
  selector: 'app-holerite',
  template: `
    <div class="bg-gray-900 text-white min-h-screen font-sans">
      <!-- Header -->
      <header class="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 p-4 flex items-center shadow-lg">
        @if (employee(); as emp) {
          <a [routerLink]="['/portal', emp.id]" class="text-sky-400 hover:text-sky-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </a>
        }
        <div class="flex-1 text-center">
          <h1 class="text-xl font-bold">Meus Holerites</h1>
          @if (employee(); as emp) {
            <p class="text-sm text-gray-400">{{ emp.name }}</p>
          }
        </div>
        <div class="w-6"></div>
      </header>

      <main class="p-4 sm:p-6">
        @if (loading()) {
          <div class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
          </div>
        } @else if (error()) {
          <div class="bg-rose-900/50 border border-rose-700 text-rose-300 p-4 rounded-lg text-center">
            <p class="font-bold">Erro ao Carregar</p>
            <p>{{ error() }}</p>
            <button (click)="loadHolerite()" class="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors">Tentar Novamente</button>
          </div>
        } @else {
          <!-- Period Selector -->
          <div class="mb-6 flex justify-center items-center gap-2 sm:gap-4 p-2 bg-gray-800 rounded-lg">
            <button (click)="changeMonth(-1)" class="p-2 rounded-full hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span class="font-semibold text-lg w-32 text-center capitalize">{{ displayMonth() }} / {{ selectedYear() }}</span>
             <button (click)="changeMonth(1)" [disabled]="isNextMonthDisabled()" [class.opacity-50]="isNextMonthDisabled()" class="p-2 rounded-full hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          @if (holerite(); as h) {
            <div class="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
                <h2 class="text-2xl font-bold text-sky-400 text-center border-b border-gray-700 pb-4">Demonstrativo de Pagamento</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div class="bg-gray-700/50 p-4 rounded-lg">
                    <p class="text-gray-400">Funcionário</p>
                    <p class="font-semibold text-base">{{ h.name }}</p>
                  </div>
                  <div class="bg-gray-700/50 p-4 rounded-lg">
                    <p class="text-gray-400">Cargo</p>
                    <p class="font-semibold text-base">{{ h.cargo }}</p>
                  </div>
                   <div class="bg-gray-700/50 p-4 rounded-lg">
                    <p class="text-gray-400">Período</p>
                    <p class="font-semibold text-base capitalize">{{ holeritePeriod() }}</p>
                  </div>
                </div>
                
                 <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="border-b border-gray-600 text-gray-400">
                            <tr>
                                <th class="p-2">Descrição</th>
                                <th class="p-2 text-right">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-gray-700">
                                <td class="p-2">Salário Base</td>
                                <td class="p-2 text-right text-emerald-400">{{ h.pago_base | number:'1.2-2':'pt-BR' }}</td>
                            </tr>
                             <tr class="border-b border-gray-700">
                                <td class="p-2">Horas Extras ({{ h.horas_extras }}h)</td>
                                <td class="p-2 text-right text-emerald-400">{{ h.pago_extra | number:'1.2-2':'pt-BR' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Totals -->
                <div class="pt-4 border-t border-gray-700 mt-4 flex justify-end">
                    <div class="text-right">
                       <p class="text-gray-400">Total a Pagar</p>
                       <p class="text-2xl font-bold text-sky-300">R$ {{ h.total_a_pagar | number:'1.2-2':'pt-BR' }}</p>
                    </div>
                </div>
                 <div class="pt-4 border-t border-gray-700 mt-4 grid grid-cols-2 gap-4 text-center">
                     <div>
                        <p class="text-gray-400">Horas Programadas</p>
                        <p class="text-lg font-semibold">{{ h.horas_programadas }}h</p>
                    </div>
                     <div>
                        <p class="text-gray-400">Horas Trabalhadas</p>
                        <p class="text-lg font-semibold">{{ h.horas_trabajadas }}h</p>
                    </div>
                </div>
            </div>
          } @else {
              <div class="text-center py-10 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p class="mt-4 font-semibold">Nenhum holerite encontrado</p>
                <p class="text-sm">Não há dados de folha de pagamento para o período selecionado.</p>
              </div>
          }
        }
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class HoleriteComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  employee = signal<Funcionario | null>(null);
  holeriteResponse = signal<FolhaPagamentoResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private readonly currentDate = new Date();
  selectedYear = signal(this.currentDate.getFullYear());
  selectedMonth = signal(this.currentDate.getMonth() + 1); // 1-12

  holerite = computed<FolhaPagamentoFuncionario | null>(() => {
    const res = this.holeriteResponse();
    const empId = this.employee()?.id;
    if (!res || !empId || !res.empleados) return null;
    return res.empleados.find(e => e.employeeId === empId) || null;
  });
  
  holeritePeriod = computed(() => this.holeriteResponse()?.periodo || '');

  displayMonth = computed(() => {
    const date = new Date(this.selectedYear(), this.selectedMonth() - 1);
    return date.toLocaleString('pt-BR', { month: 'long' });
  });
  
  isNextMonthDisabled = computed(() => {
    const selectedDate = new Date(this.selectedYear(), this.selectedMonth() - 1);
    const currentMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth());
    return selectedDate >= currentMonth;
  });

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('id');
    if (employeeId) {
        this.apiService.getFuncionarioById(employeeId).subscribe({
            next: (emp) => {
                if (emp) {
                    this.employee.set(emp);
                    this.loadHolerite();
                } else {
                    this.router.navigate(['/']);
                }
            },
            error: () => this.router.navigate(['/'])
        });
    } else {
        this.router.navigate(['/']);
    }
  }

  loadHolerite(): void {
    const emp = this.employee();
    if (!emp) {
        this.error.set("Funcionário não encontrado.");
        return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.holeriteResponse.set(null);

    const year = this.selectedYear().toString();
    const month = this.selectedMonth().toString().padStart(2, '0');

    this.apiService.getFolhaPagamento(month, year, emp.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.holeriteResponse.set(data);
        },
        error: (err) => {
          this.error.set(err.message || 'Falha ao carregar holerite.');
          this.holeriteResponse.set(null); 
        },
      });
  }

  changeMonth(delta: number): void {
    let currentMonth = this.selectedMonth();
    let currentYear = this.selectedYear();

    currentMonth += delta;
    
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    } else if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    
    const newDate = new Date(currentYear, currentMonth - 1);
    if(newDate > this.currentDate && delta > 0) return;


    this.selectedMonth.set(currentMonth);
    this.selectedYear.set(currentYear);
    this.loadHolerite();
  }
}
