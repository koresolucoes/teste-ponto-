import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { Funcionario } from '../../models/funcionario.model';
import { ApiService } from '../../services/api.service';
import { Schedule, Shift } from '../../models/escala.model';

interface DailySchedule {
    date: Date;
    dayName: string;
    shift: Shift | null;
    isDayOff: boolean;
    hasSchedule: boolean;
}

@Component({
  selector: 'app-escala',
  template: `
    <main class="bg-gray-100 min-h-screen p-4 flex flex-col items-center font-sans">
      <div class="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
        <header class="flex justify-between items-center border-b pb-4 mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Minha Escala</h1>
          <a routerLink="/" class="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Voltar</span>
          </a>
        </header>

        @if (employee(); as emp) {
          <div class="mb-6 text-center">
            <h2 class="text-xl font-semibold text-gray-700">{{ emp.name }}</h2>
            <p class="text-gray-500">{{ emp.roles.name }}</p>
          </div>
        }

        @if (loading()) {
          <div class="flex justify-center items-center p-8">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          </div>
        } @else if (error(); as errorMessage) {
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Erro!</strong>
            <span class="block sm:inline ml-2">{{ errorMessage }}</span>
          </div>
        } @else {
          <div class="border rounded-lg overflow-hidden">
            @if (hasAnySchedule()) {
              <ul class="divide-y divide-gray-200">
                @for (day of weeklySchedule(); track day.date) {
                  <li class="p-4 flex justify-between items-center">
                    <div>
                      <p class="font-semibold text-gray-800">{{ day.dayName }}</p>
                      <p class="text-sm text-gray-500">{{ day.date | date:'dd/MM/yyyy' }}</p>
                    </div>
                    <div>
                      @if (day.hasSchedule) {
                        @if (day.isDayOff) {
                          <span class="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">Folga</span>
                        } @else {
                          <span class="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">{{ day.shift!.start_time | date:'HH:mm' }} - {{ day.shift!.end_time | date:'HH:mm' }}</span>
                        }
                      } @else {
                        <span class="text-gray-400 italic">Sem escala</span>
                      }
                    </div>
                  </li>
                }
              </ul>
            } @else {
              <div class="text-center p-8">
                <p class="text-gray-500">Nenhuma escala encontrada para esta semana.</p>
              </div>
            }
          </div>
        }
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class EscalaComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  employee = signal<Funcionario | null>(null);
  schedules = signal<Schedule[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  private readonly daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  weeklySchedule = computed<DailySchedule[]>(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);
    
    const weekDays: Date[] = Array.from({length: 7}, (_, i) => {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        return day;
    });

    const allShifts = this.schedules().flatMap(s => s.shifts);

    return weekDays.map(date => {
        const dateString = this.formatDate(date);
        const shift = allShifts.find(s => this.formatDate(new Date(s.start_time)) === dateString);
        
        return {
            date: date,
            dayName: this.daysOfWeek[date.getDay()],
            shift: shift || null,
            isDayOff: shift?.is_day_off || false,
            hasSchedule: !!shift
        };
    });
  });
  
  hasAnySchedule = computed<boolean>(() => {
    const schedule = this.weeklySchedule();
    return schedule.length > 0 && schedule.some(day => day.hasSchedule);
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
    if (this.employee()) {
      this.loadEscala();
    }
  }

  loadEscala(): void {
    if (!this.employee()) return;

    this.loading.set(true);
    this.error.set(null);
    this.schedules.set([]);

    const { startDate, endDate } = this.getDateRangeForCurrentWeek();
    
    this.apiService.getEscalas(startDate, endDate)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
            const employeeId = this.employee()!.id;
            const employeeSchedules = data.map(schedule => ({
                ...schedule,
                shifts: schedule.shifts.filter(shift => shift.employee_id === employeeId)
            })).filter(schedule => schedule.shifts.length > 0);
            this.schedules.set(employeeSchedules);
        },
        error: (err) => this.error.set(err.message || 'Falha ao carregar a escala.'),
      });
  }

  private getDateRangeForCurrentWeek(): { startDate: string, endDate: string } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ...
    const startDate = new Date(now);
    // Set to the beginning of the week (Sunday)
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    // Set to the end of the week (Saturday)
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
