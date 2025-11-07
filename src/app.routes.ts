import { Routes } from '@angular/router';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { PinPadComponent } from './components/pin-pad/pin-pad.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ClockStatusComponent } from './components/clock-status/clock-status.component';

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
    path: 'status',
    component: ClockStatusComponent,
    title: 'Ponto Móvel - Status',
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
