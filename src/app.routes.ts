import { Routes } from '@angular/router';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TimeSheetComponent } from './components/time-sheet/time-sheet.component';
import { EscalaComponent } from './components/escala/escala.component';
import { HoleriteComponent } from './components/holerite/holerite.component';
import { PortalComponent } from './components/portal/portal.component';
import { authGuard } from './services/auth.guard';
import { PinPadComponent } from './components/pin-pad/pin-pad.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    component: EmployeeListComponent,
    title: 'Ponto Móvel - Selecionar Funcionário',
  },
  {
    path: 'pin/:id',
    component: PinPadComponent,
    title: 'Ponto Móvel - Inserir PIN',
  },
  {
    path: 'portal/:id',
    component: PortalComponent,
    title: 'Portal do Colaborador',
    canActivate: [authGuard],
  },
  {
    path: 'espelho-ponto/:id',
    component: TimeSheetComponent,
    title: 'Ponto Móvel - Espelho de Ponto',
    canActivate: [authGuard],
  },
  {
    path: 'escala/:id',
    component: EscalaComponent,
    title: 'Portal do Colaborador - Minha Escala',
    canActivate: [authGuard],
  },
  {
    path: 'holerite/:id',
    component: HoleriteComponent,
    title: 'Portal do Colaborador - Meus Holerites',
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    title: 'Ponto Móvel - Configurações',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
