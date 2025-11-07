import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const loggedInEmployeeId = authService.loggedInEmployeeId();
  const requestedEmployeeId = route.paramMap.get('id');

  if (loggedInEmployeeId && loggedInEmployeeId === requestedEmployeeId) {
    // Se o ID do usuário logado corresponde ao ID na rota, permite o acesso.
    return true;
  }

  // Se não houver usuário logado ou os IDs não corresponderem,
  // redireciona para o portal do usuário logado (se existir) ou para a tela de login.
  if (loggedInEmployeeId) {
    router.navigate(['/portal', loggedInEmployeeId]);
  } else {
    router.navigate(['/']);
  }
  
  return false;
};
