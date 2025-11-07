export interface FolhaPagamentoFuncionario {
  employeeId: string;
  name: string;
  cargo: string;
  horas_programadas: number;
  horas_trabajadas: number;
  horas_extras: number;
  pago_base: number;
  pago_extra: number;
  total_a_pagar: number;
}

export interface FolhaPagamentoResponse {
  periodo: string;
  totales: {
    total_a_pagar: number;
    total_horas_extras: number;
    total_horas_trabalhadas: number;
  };
  empleados: FolhaPagamentoFuncionario[];
}
