import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Funcionario } from '../models/funcionario.model';
import { BaterPontoRequest, BaterPontoResponse, TimeSheetEntry } from '../models/ponto.model';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly settingsService = inject(SettingsService);

  // Usando um proxy CORS para evitar problemas de CORS durante o desenvolvimento
  private readonly proxiedBaseUrl = 'https://gastro.koresolucoes.com.br/api/rh';

  private getOptions(): { headers: HttpHeaders, params: HttpParams } | null {
    if (!this.settingsService.isConfigured()) {
      return null;
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.settingsService.apiKey()!}`,
    });
    const params = new HttpParams().set('restaurantId', this.settingsService.restaurantId()!);
    return { headers, params };
  }

  getFuncionarios(): Observable<Funcionario[]> {
    const options = this.getOptions();
    if (!options) {
      return throwError(() => new Error('API não configurada.'));
    }
    // Usando a URL com proxy
    return this.http.get<Funcionario[]>(`${this.proxiedBaseUrl}/funcionarios`, options)
      .pipe(catchError((error) => this.handleError(error)));
  }

  baterPonto(data: BaterPontoRequest): Observable<BaterPontoResponse> {
    const options = this.getOptions();
    if (!options) {
      return throwError(() => new Error('API não configurada.'));
    }
    // Usando a URL com proxy
    return this.http.post<BaterPontoResponse>(`${this.proxiedBaseUrl}/ponto/bater-ponto`, data, options)
      .pipe(catchError((error) => this.handleError(error)));
  }

  getRegistrosPonto(employeeId: string, data_inicio: string, data_fim: string): Observable<TimeSheetEntry[]> {
    const options = this.getOptions();
    if (!options) {
      return throwError(() => new Error('API não configurada.'));
    }

    const params = options.params
      .set('employeeId', employeeId)
      .set('data_inicio', data_inicio)
      .set('data_fim', data_fim);

    return this.http.get<TimeSheetEntry[]>(`${this.proxiedBaseUrl}/ponto`, { headers: options.headers, params: params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    let errorMessage = 'Ocorreu um erro desconhecido.';
    
    if (error.status === 0) {
        errorMessage = 'Falha na conexão com a API. Verifique a rede ou um possível problema de CORS.';
        return throwError(() => new Error(errorMessage));
    }

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      if (error.status === 401 || error.status === 403) {
        errorMessage = 'Credenciais da API inválidas ou não fornecidas. Verifique as configurações.';
      } else {
        errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
