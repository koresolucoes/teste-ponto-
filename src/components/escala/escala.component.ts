import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { Funcionario } from '../../models/funcionario.model';
import { ApiService } from '../../services/api.service';
import { Shift } from '../../models/escala.model';

interface DaySchedule {
  date: Date;
  shift: Shift | null;
}

@Component({
  selector: 'app-escala',
  templateUrl: './escala.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, DatePipe],
})
export class EscalaComponent {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  employee = signal<Funcionario | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Start date of the currently viewed week (always a Monday)
  currentWeekStart = signal(this.getStartOfWeek(new Date()));
  
  private employeeShifts = signal<Shift[]>([]);

  weekSchedule = computed<DaySchedule[]>(() => {
    const start = this.currentWeekStart();
    const shifts = this.employeeShifts();
    const days: DaySchedule[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      const shiftForDay = shifts.find(s => this.isSameDay(new Date(s.start_time), date)) || null;
      days.push({ date, shift: shiftForDay });
    }
    return days;
  });

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const employeeFromState = navigation?.extras.state?.['employee'] as Funcionario | undefined;
    
    if (employeeFromState) {
      this.employee.set(employeeFromState);
      this.loadEscalas();
    } else {
      this.router.navigate(['/']);
    }
  }

  loadEscalas(): void {
    if (!this.employee()) return;

    this.loading.set(true);
    this.error.set(null);
    this.employeeShifts.set([]);

    const startDate = this.formatDate(this.currentWeekStart());
    const endDate = this.formatDate(this.getEndOfWeek(this.currentWeekStart()));
    
    this.apiService.getEscalas(startDate, endDate)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (schedules) => {
          const allShifts = schedules.flatMap(s => s.shifts);
          const empShifts = allShifts.filter(s => s.employee_id === this.employee()!.id);
          this.employeeShifts.set(empShifts);
        },
        error: (err) => this.error.set(err.message || 'Falha ao carregar a escala.'),
      });
  }
  
  changeWeek(offset: number): void {
    this.currentWeekStart.update(current => {
        const newDate = new Date(current);
        newDate.setDate(current.getDate() + (offset * 7));
        return newDate;
    });
    this.loadEscalas();
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  private getEndOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + 6);
    return d;
  }
  
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
