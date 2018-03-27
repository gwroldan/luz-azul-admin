import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AgruparPedidosComponent } from './pedidos/agrupar/agrupar-pedidos.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { InputFileModule } from 'ngx-input-file';
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
    Routing
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
