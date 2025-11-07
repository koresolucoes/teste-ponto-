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
  templateUrl: './escala.component.html',
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
