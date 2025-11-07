import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { Funcionario } from '../../models/funcionario.model';
import { BaterPontoResponse, BaterPontoStatus, TimeClockEntry } from '../../models/ponto.model';
import { ApiService } from '../../services/api.service';

type GroupedHistory = [string, TimeClockEntry[]];

@Component({
  selector: 'app-clock-status',
  templateUrl: './clock-status.component.html',
  styleUrls: ['./clock-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  providers: [DatePipe],
})
export class ClockStatusComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly datePipe = inject(DatePipe);

  employee = signal<Funcionario | null>(null);
  pontoResponse = signal<BaterPontoResponse | null>(null);

  history = signal<TimeClockEntry[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  private logoutTimer: any;
  
  groupedHistory = computed<GroupedHistory[]>(() => {
    const groups = new Map<string, TimeClockEntry[]>();
    for (const entry of this.history()) {
      const dateKey = this.datePipe.transform(entry.clock_in_time, 'yyyy-MM-dd')!;
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(entry);
    }
    
    // Sort groups by date descending
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  });

  private readonly colors = [
    'bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-pink-500'
  ];

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { employee: Funcionario, pontoResponse: BaterPontoResponse } | undefined;

    if (state?.employee && state?.pontoResponse) {
      this.employee.set(state.employee);
      this.pontoResponse.set(state.pontoResponse);
    } else {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    if (this.employee()) {
      this.loadHistory();
    }
    this.logoutTimer = setTimeout(() => this.logout(), 30000);
  }

  ngOnDestroy(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getRegistrosPonto(this.employee()!.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.history.set(data),
        error: (err) => this.error.set('Falha ao carregar histórico de ponto.'),
      });
  }

  logout(): void {
    this.router.navigate(['/']);
  }
  
  getSuccessMessage(status: BaterPontoStatus): string {
    switch (status) {
      case 'TURNO_INICIADO': return 'Turno iniciado com sucesso!';
      case 'PAUSA_INICIADA': return 'Pausa iniciada. Bom descanso!';
      case 'PAUSA_FINALIZADA': return 'Pausa finalizada. De volta ao trabalho!';
      case 'TURNO_FINALIZADO': return 'Turno finalizado. Até a próxima!';
      default: return 'Operação realizada com sucesso!';
    }
  }
  
  getInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return this.colors[0];
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.colors[charCodeSum % this.colors.length];
  }

  getDuration(startTime: string, endTime: string | null): string {
    if (!endTime) return 'Em andamento';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();

    if (isNaN(diffMs) || diffMs < 0) return '-';

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  }
}
