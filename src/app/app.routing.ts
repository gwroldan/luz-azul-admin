import { Routes, RouterModule } from '@angular/router';
import { AgruparPedidosComponent } from './pedidos/agrupar/agrupar-pedidos.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const APP_ROUTES: Routes = [
  { path: '', component: DashboardComponent, pathMatch: 'full' },
  { path: 'agrupar-pedidos', component: AgruparPedidosComponent }
];

export const Routing = RouterModule.forRoot(APP_ROUTES);
