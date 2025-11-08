export type AusenciaRequestType = 'Férias' | 'Folga' | 'Falta Justificada' | 'Atestado';

export interface Ausencia {
  id: string;
  employee_id: string;
  request_type: AusenciaRequestType;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  start_date: string;
  end_date: string;
  reason: string | null;
  attachment_url?: string;
  employees?: { name: string };
}

export interface CriarAusenciaRequest {
  employeeId: string;
  request_type: AusenciaRequestType;
  start_date: string;
  end_date: string;
  reason?: string;
  attachment?: string;
  attachment_filename?: string;
}
