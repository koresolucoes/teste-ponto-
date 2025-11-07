import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Funcionario } from '../models/funcionario.model';
import { BaterPontoRequest, BaterPontoResponse, TimeSheetEntry } from '../models/ponto.model';
import { SettingsService } from './settings.service';
import { Schedule } from '../models/escala.model';
import { FolhaPagamentoResponse } from '../models/folha-pagamento.model';
import { VerificarPinRequest, VerificarPinResponse } from '../models/auth.model';

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
    return this.http.get<Funcionario[]>(`${this.proxiedBaseUrl}/funcionarios`, options)
      .pipe(catchError((error) => this.handleError(error)));
  }

  getFuncionarioById(id: string): Observable<Funcionario | undefined> {
    return this.getFuncionarios().pipe(
      map(funcionarios => funcionarios.find(f => f.id === id))
    );
  }

  verificarPin(data: VerificarPinRequest): Observable<VerificarPinResponse> {
    const options = this.getOptions();
    if (!options) {
      return throwError(() => new Error('API não configurada.'));
    }
    return this.http.post<VerificarPinResponse>(`${this.proxiedBaseUrl}/verificar-pin`, data, options)
      .pipe(catchError((error) => this.handleError(error)));
  }

  baterPonto(data: BaterPontoRequest): Observable<BaterPontoResponse> {
    const options = this.getOptions();
    if (!options) {
      return throwError(() => new Error('API não configurada.'));
    }
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
  
  getUltimoRegistroPonto(employeeId: string): Observable<TimeSheetEntry | null> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Busca dos últimos 7 dias para garantir que pegamos a última ação
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    return this.getRegistrosPonto(employeeId, oneWeekAgoStr, todayStr).pipe(
      map(entries => {
        if (entries && entries.length > 0) {
          // Ordena em ordem decrescente pelo tempo de entrada e retorna o mais recente.
          return entries.sort((a, b) => new Date(b.clock_in_time).getTime() - new Date(a.clock_in_time).getTime())[0];
        }
        return null;
      }),
      catchError(() => [null]) // Retorna nulo em caso de erro para não quebrar a UI
    );
  }

  getEscalas(data_inicio: string, data_fim: string): Observable<Schedule[]> {
    const options = this.getOptions();
    if (!options) {
      return throwError(() => new Error('API não configurada.'));
    }

     const params = options.params
      .set('data_inicio', data_inicio)
      .set('data_fim', data_fim);

    return this.http.get<Schedule[]>(`${this.proxiedBaseUrl}/escalas`, { headers: options.headers, params: params })
        .pipe(catchError((error) => this.handleError(error)));
  }

  getFolhaPagamento(mes: string, ano: string, employeeId: string): Observable<FolhaPagamentoResponse> {
    const options = this.getOptions();
    if (!options) {
        return throwError(() => new Error('API não configurada.'));
    }

    const params = options.params
        .set('action', 'resumo')
        .set('mes', mes)
        .set('ano', ano)
        .set('employeeId', employeeId);
    
    return this.http.get<FolhaPagamentoResponse>(`${this.proxiedBaseUrl}/folha-pagamento`, { headers: options.headers, params: params })
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
         if (error.url?.includes('ponto') || error.url?.includes('verificar-pin')) {
           errorMessage = 'PIN incorreto.';
         }
      } else {
        errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}