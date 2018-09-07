import { Routes, RouterModule } from '@angular/router';

import { AgruparPedidosComponent } from './pedidos/agrupar/agrupar-pedidos.component';
import { ControlLiquidacionesComponent } from './sueldos/control/control-liquidaciones.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { MyGuardService } from './services/my-guard.service';
import { BlankComponent } from './componentes/blank/blank.component';

const APP_ROUTES: Routes = [
  { path: '', component: DashboardComponent, pathMatch: 'full' },
  { path: 'agrupar-pedidos', component: AgruparPedidosComponent, canActivate: [MyGuardService] },
  { path: 'control-liquidaciones', component: ControlLiquidacionesComponent, canActivate: [MyGuardService] },
  { path: 'blank', component: BlankComponent },
  { path: 'login', component: LoginComponent }
];

export const Routing = RouterModule.forRoot(APP_ROUTES);
