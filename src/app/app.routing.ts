import { Routes, RouterModule } from '@angular/router';

import { AgruparPedidosComponent } from './pedidos/agrupar/agrupar-pedidos.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { MyGuardService } from './services/my-guard.service';

const APP_ROUTES: Routes = [
  { path: '', component: DashboardComponent, pathMatch: 'full' },
  { path: 'agrupar-pedidos', component: AgruparPedidosComponent, canActivate: [MyGuardService] },
  { path: 'login', component: LoginComponent }
];

export const Routing = RouterModule.forRoot(APP_ROUTES);
