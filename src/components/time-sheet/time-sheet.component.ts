import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { Funcionario } from '../../models/funcionario.model';
import { ApiService } from '../../services/api.service';
import { TimeSheetEntry } from '../../models/ponto.model';

type Period = 'week' | 'month';

@Component({
  selector: 'app-time-sheet',
  templateUrl: './time-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class TimeSheetComponent {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  employee = signal<Funcionario | null>(null);
  entries = signal<TimeSheetEntry[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  selectedPeriod = signal<Period>('week');

  totalHours = computed(() => {
    const totalMilliseconds = this.entries().reduce((acc, entry) => {
        if (entry.clock_out_time) {
            const startTime = new Date(entry.clock_in_time).getTime();
            const endTime = new Date(entry.clock_out_time).getTime();
            if (endTime > startTime) {
              return acc + (endTime - startTime);
            }
        }
        return acc;
    }, 0);

    if(totalMilliseconds <= 0) return '00h 00m';

    const hours = Math.floor(totalMilliseconds / 3600000);
    const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
    
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  });

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const employeeFromState = navigation?.extras.state?.['employee'] as Funcionario | undefined;
    
    if (employeeFromState) {
      this.employee.set(employeeFromState);
      this.loadEntries();
    } else {
      // If state is lost (e.g., page refresh), we redirect to home.
      this.router.navigate(['/']);
    }
  }

  loadEntries(): void {
    if (!this.employee()) return;

    this.loading.set(true);
    this.error.set(null);
    this.entries.set([]);

    const { startDate, endDate } = this.getDateRange(this.selectedPeriod());
    
    this.apiService.getRegistrosPonto(this.employee()!.id, startDate, endDate)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.entries.set(data.sort((a,b) => new Date(b.clock_in_time).getTime() - new Date(a.clock_in_time).getTime())),
        error: (err) => this.error.set(err.message || 'Falha ao carregar registros de ponto.'),
      });
  }

  selectPeriod(period: Period): void {
    this.selectedPeriod.set(period);
    this.loadEntries();
  }

  private getDateRange(period: Period): { startDate: string, endDate: string } {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else { // week
      const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, etc.
      startDate = new Date(now);
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
    }
    
    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  calculateDuration(start: string, end: string | null): string {
    if (!end) return 'Em andamento';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;
    if (diff < 0) return 'N/A';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  }
}
