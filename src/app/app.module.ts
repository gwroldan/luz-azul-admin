import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AgruparPedidosComponent } from './pedidos/agrupar/agrupar-pedidos.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { InputFileModule } from 'ngx-input-file';
import { NgxStepperModule } from 'ngx-stepper';
import { ChartsModule } from 'ng2-charts';
import { Routing } from './app.routing';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AgruparPedidosComponent
  ],
  imports: [
    BrowserModule,
    InputFileModule,
    NgxStepperModule,
    ChartsModule,
    Routing
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
