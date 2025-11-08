import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { Funcionario } from '../../models/funcionario.model';
import { ApiService } from '../../services/api.service';
import { Ausencia, AusenciaRequestType, CriarAusenciaRequest } from '../../models/ausencia.model';

@Component({
  selector: 'app-ausencias',
  templateUrl: './ausencias.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
})
export class AusenciasComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  employee = signal<Funcionario | null>(null);
  ausencias = signal<Ausencia[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  formVisible = signal(false);
  formSubmitting = signal(false);
  formError = signal<string | null>(null);
  selectedFile = signal<{ name: string; content: string; } | null>(null);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  requestForm: FormGroup;
  
  readonly requestTypes: AusenciaRequestType[] = ['Férias', 'Folga', 'Falta Justificada', 'Atestado'];

  statusMap = computed(() => ({
    Pendente: { text: 'Pendente', class: 'bg-amber-900/50 text-amber-300' },
    Aprovado: { text: 'Aprovado', class: 'bg-emerald-900/50 text-emerald-300' },
    Rejeitado: { text: 'Rejeitado', class: 'bg-rose-900/50 text-rose-300' },
  }));
  
  constructor() {
    this.requestForm = this.fb.group({
      request_type: [this.requestTypes[0], Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      reason: [''],
    }, { validator: this.dateRangeValidator });
  }

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('id');
    if (employeeId) {
      this.apiService.getFuncionarioById(employeeId).subscribe({
        next: (emp) => {
          if (emp) {
            this.employee.set(emp);
            this.loadAusencias();
          } else {
            this.router.navigate(['/']);
          }
        },
        error: () => this.router.navigate(['/']),
      });
    } else {
      this.router.navigate(['/']);
    }
  }

  dateRangeValidator(group: FormGroup) {
    const start = group.get('start_date')?.value;
    const end = group.get('end_date')?.value;
    return start && end && new Date(start) > new Date(end) ? { invalidRange: true } : null;
  }

  loadAusencias(): void {
    if (!this.employee()) return;
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getAusencias(this.employee()!.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.ausencias.set(data.sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())),
        error: (err) => this.error.set(err.message || 'Falha ao carregar solicitações.'),
      });
  }
  
  toggleFormVisibility(): void {
    this.formVisible.update(v => !v);
    if (!this.formVisible()) {
      this.requestForm.reset({ request_type: this.requestTypes[0] });
      this.formError.set(null);
      this.clearFile();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const base64Content = e.target.result.split(',')[1];
            this.selectedFile.set({
                name: file.name,
                content: base64Content
            });
        };
        reader.readAsDataURL(file);
    }
  }

  clearFile(): void {
      this.selectedFile.set(null);
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
  }

  submitRequest(): void {
    if (this.requestForm.invalid || !this.employee()) {
      return;
    }

    this.formSubmitting.set(true);
    this.formError.set(null);
    
    const formValue = this.requestForm.value;
    const requestData: CriarAusenciaRequest = {
      employeeId: this.employee()!.id,
      request_type: formValue.request_type,
      start_date: formValue.start_date,
      end_date: formValue.end_date,
      reason: formValue.reason || undefined
    };

    const file = this.selectedFile();
    if (file) {
      requestData.attachment = file.content;
      requestData.attachment_filename = file.name;
    }

    this.apiService.solicitarAusencia(requestData)
      .pipe(finalize(() => this.formSubmitting.set(false)))
      .subscribe({
        next: (newAusencia) => {
          this.ausencias.update(list => [newAusencia, ...list].sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()));
          this.toggleFormVisibility();
        },
        error: (err) => this.formError.set(err.message || 'Falha ao enviar solicitação.'),
      });
  }
}
