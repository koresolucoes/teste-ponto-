
export interface BaterPontoRequest {
  employeeId: string;
  pin: string;
}

export type BaterPontoStatus =
  | 'TURNO_INICIADO'
  | 'PAUSA_INICIADA'
  | 'PAUSA_FINALIZADA'
  | 'TURNO_FINALIZADO';

export interface BaterPontoResponse {
  status: BaterPontoStatus;
  employeeName: string;
}
