import { Routes } from '@angular/router';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { PinPadComponent } from './components/pin-pad/pin-pad.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ConfirmationComponent } from './components/confirmation/confirmation.component';
import { TimeSheetComponent } from './components/time-sheet/time-sheet.component';
import { EscalaComponent } from './components/escala/escala.component';
import { HoleriteComponent } from './components/holerite/holerite.component';

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
    path: 'ponto-registrado',
    component: ConfirmationComponent,
    title: 'Ponto Móvel - Ponto Registrado',
  },
  {
    path: 'espelho-ponto/:id',
    component: TimeSheetComponent,
    title: 'Ponto Móvel - Espelho de Ponto',
  },
  {
    path: 'escala/:id',
    component: EscalaComponent,
    title: 'Portal do Colaborador - Minha Escala',
  },
  {
    path: 'holerite/:id',
    component: HoleriteComponent,
    title: 'Portal do Colaborador - Meus Holerites',
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
