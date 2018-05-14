import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { AgruparPedidosComponent } from './pedidos/agrupar/agrupar-pedidos.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { InputFileModule } from 'ngx-input-file';
import { NgxStepperModule } from 'ngx-stepper';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { ChartsModule } from 'ng2-charts';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { Routing } from './app.routing';

import { AutorizacionService } from './services/autorizacion.service';
import { MyGuardService } from './services/my-guard.service';
import { DataService } from './services/data.service';
import { BlankComponent } from './componentes/blank/blank.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    AgruparPedidosComponent,
    BlankComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    InputFileModule,
    NgxStepperModule,
    Ng2SmartTableModule,
    ChartsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    Routing
  ],
  providers: [
    AutorizacionService,
    MyGuardService,
    DataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
