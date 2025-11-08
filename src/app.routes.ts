import { Routes } from '@angular/router';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { TimeSheetComponent } from './components/time-sheet/time-sheet.component';
import { EscalaComponent } from './components/escala/escala.component';
import { HoleriteComponent } from './components/holerite/holerite.component';
import { PortalComponent } from './components/portal/portal.component';
import { authGuard } from './services/auth.guard';
import { PinPadComponent } from './components/pin-pad/pin-pad.component';
import { AusenciasComponent } from './components/ausencias/ausencias.component';
import { QrScannerComponent } from './components/qr-scanner/qr-scanner.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    component: EmployeeListComponent,
    title: 'Chefe\'s Time - Selecionar Funcionário',
  },
  {
    path: 'scan',
    component: QrScannerComponent,
    title: 'Chefe\'s Time - Escanear QR Code',
  },
  {
    path: 'pin/:id',
    component: PinPadComponent,
    title: 'Chefe\'s Time - Inserir PIN',
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
    title: 'Chefe\'s Time - Espelho de Ponto',
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
    path: 'ausencias/:id',
    component: AusenciasComponent,
    title: 'Portal do Colaborador - Minhas Ausências',
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
