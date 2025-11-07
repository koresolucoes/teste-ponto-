import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

const LOGGED_IN_EMPLOYEE_ID_KEY = 'gastronomico_logged_in_employee_id';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);
  
  loggedInEmployeeId = signal<string | null>(localStorage.getItem(LOGGED_IN_EMPLOYEE_ID_KEY));

  login(employeeId: string): void {
    localStorage.setItem(LOGGED_IN_EMPLOYEE_ID_KEY, employeeId);
    this.loggedInEmployeeId.set(employeeId);
  }

  logout(): void {
    localStorage.removeItem(LOGGED_IN_EMPLOYEE_ID_KEY);
    this.loggedInEmployeeId.set(null);
    this.router.navigate(['/']);
  }
}
