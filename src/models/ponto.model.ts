
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

export interface TimeClockEntry {
  id: string;
  employee_id: string;
  clock_in_time: string; // ISO date string
  clock_out_time: string | null;
}
