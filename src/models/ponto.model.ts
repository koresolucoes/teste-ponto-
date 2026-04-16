
export interface BaterPontoRequest {
  employeeId: string;
  type: 'IN' | 'OUT';
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

export interface TimeSheetEntry {
  id: string;
  employee_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
}