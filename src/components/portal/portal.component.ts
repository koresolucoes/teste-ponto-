import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { Funcionario } from '../../models/funcionario.model';
import { BaterPontoRequest, BaterPontoResponse, BaterPontoStatus, TimeSheetEntry } from '../../models/ponto.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Coordinates, GeolocationService } from '../../services/geolocation.service';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe],
})
export class PortalComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly geolocationService = inject(GeolocationService);

  employee = signal<Funcionario | null>(null);
  lastActionMessage = signal('Carregando último registro...');
  lastActionTime = signal<Date | null>(null);
  
  // Estado do Modal
  showPinModal = signal(false);
  modalPin = signal('');
  modalStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  modalMessage = signal('');
  
  modalPinDots = computed(() => Array(4).fill(0).map((_, i) => i < this.modalPin().length));
  keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Limpar', '0', '<'];
  
  private readonly colors = [
    'bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-pink-500'
  ];

  constructor() {
    const employeeId = this.route.snapshot.paramMap.get('id');
    if (employeeId) {
      this.apiService.getFuncionarioById(employeeId).subscribe(emp => {
        if (emp) {
          this.employee.set(emp);
          this.loadLastAction(employeeId);
        } else {
          this.authService.logout();
        }
      });
    } else {
      this.authService.logout();
    }
  }

  loadLastAction(employeeId: string): void {
    this.apiService.getUltimoRegistroPonto(employeeId).subscribe(lastEntry => {
      if (lastEntry) {
        this.displayLastActionFromHistory(lastEntry);
      } else {
        this.lastActionMessage.set('Nenhum registro de ponto. Pronto para iniciar o turno!');
        this.lastActionTime.set(null);
      }
    });
  }
  
  private displayLastActionFromHistory(entry: TimeSheetEntry): void {
    this.lastActionTime.set(new Date(entry.clock_in_time));
    if (entry.clock_out_time) {
        this.lastActionMessage.set('Última ação: Fim de turno');
    } else {
        // Limitação: a API de histórico não informa se o ponto aberto é início de turno ou de pausa.
        this.lastActionMessage.set('Turno em andamento');
    }
  }

  private displayLastActionFromBaterPonto(response: BaterPontoResponse): void {
    this.lastActionMessage.set(this.getBaterPontoMessage(response.status));
    this.lastActionTime.set(new Date());
  }
  
  private getBaterPontoMessage(status: BaterPontoStatus): string {
    switch (status) {
      case 'TURNO_INICIADO': return 'Turno iniciado com sucesso!';
      case 'PAUSA_INICIADA': return 'Pausa iniciada.';
      case 'PAUSA_FINALIZADA': return 'Pausa finalizada.';
      case 'TURNO_FINALIZADO': return 'Turno finalizado. Bom descanso!';
      default: return 'Operação realizada com sucesso!';
    }
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

  private navigateWithState(path: string): void {
    if (this.employee()) {
      this.router.navigate([path, this.employee()!.id], {
        state: { employee: this.employee() }
      });
    }
  }

  openBaterPontoModal(): void {
    this.modalPin.set('');
    this.modalStatus.set('idle');
    this.modalMessage.set('');
    this.showPinModal.set(true);
  }
  
  closeModal(): void {
    this.showPinModal.set(false);
  }

  handleModalPinKeyPress(key: string): void {
    if (this.modalStatus() === 'loading' || this.modalStatus() === 'success') return;

    if (/\d/.test(key)) {
      this.modalPin.update(p => (p.length < 4 ? p + key : p));
    } else if (key === 'Limpar') {
      this.modalPin.set('');
    } else if (key === '<') {
      this.modalPin.update(p => p.slice(0, -1));
    }

    if (this.modalStatus() === 'error') {
      this.modalStatus.set('idle');
      this.modalMessage.set('');
    }
  }

  async submitModalPin(): Promise<void> {
    if (this.modalPin().length !== 4 || !this.employee()) return;

    this.modalStatus.set('loading');
    this.modalMessage.set('Obtendo localização...');

    let location: Coordinates | null = null;
    try {
      location = await this.geolocationService.getCurrentPositionAsPromise();
    } catch (error: any) {
      this.modalStatus.set('error');
      this.modalMessage.set(error.message || 'Falha ao obter localização.');
      this.modalPin.set(''); // Limpa o PIN no erro
      return;
    }

    this.modalMessage.set('Processando...');

    const employeeId = this.employee()!.id;
    const requestData: BaterPontoRequest = {
      employeeId,
      pin: this.modalPin(),
      latitude: location.latitude,
      longitude: location.longitude,
    };

    this.apiService.baterPonto(requestData)
      .pipe(finalize(() => {
          this.modalPin.set('');
      }))
      .subscribe({
        next: (response) => {
          this.modalStatus.set('success');
          this.modalMessage.set(this.getBaterPontoMessage(response.status));
          this.displayLastActionFromBaterPonto(response);
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.modalStatus.set('error');
          this.modalMessage.set(err.message || 'PIN incorreto. Tente novamente.');
        },
      });
  }
  
  viewTimeSheet(): void { this.navigateWithState('/espelho-ponto'); }
  viewEscala(): void { this.navigateWithState('/escala'); }
  viewHolerite(): void { this.navigateWithState('/holerite'); }
  viewAusencias(): void { this.navigateWithState('/ausencias'); }
  
  logout(): void {
    this.authService.logout();
  }
}
