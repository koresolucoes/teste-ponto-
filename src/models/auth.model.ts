export interface VerificarPinRequest {
  employeeId: string;
  pin: string;
}

export interface VerificarPinResponse {
  success: boolean;
  message: string;
  employee: {
    id: string;
    name: string;
  };
}
