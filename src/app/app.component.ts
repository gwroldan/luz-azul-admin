import {Component, OnDestroy, OnInit} from '@angular/core';

import { AutorizacionService } from './services/autorizacion.service';
import { DataService } from './services/data.service';

import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  public loggedIn = false;
  public email = '';

  // Owner Properties
  public subs: Subscription[] = [];
  public usuarioLoaded: boolean;
  public usuario: {
    depositoId: number;
    deposito: string;
    cantFilesLoad: number;
    administrador: boolean;
  } = {
    depositoId: -1,
    deposito: '',
    cantFilesLoad: -1,
    administrador: false
  };

  constructor(private autorizacionService: AutorizacionService,
              private dataService: DataService) {

  }

  public ngOnInit(): void {
    this.subs.push( this.dataService.valueDatosUsuario.subscribe( usuario => {
      this.usuarioLoaded = !!usuario;
      if (this.usuarioLoaded) {
        this.usuario.depositoId = usuario.depositoId;
        this.usuario.cantFilesLoad = usuario.cantFilesLoad;
        this.usuario.deposito = usuario.deposito;
        this.usuario.administrador = usuario.administrador;

        console.log('Usuario Cargado: ', (this.usuario !== null && this.usuario !== undefined));
        console.log('Usuario Administrador: ', this.usuario.administrador);
      }
    }));

    this.autorizacionService.isLogged()
      .subscribe((result) => {
        this.loggedIn = this.autorizacionService.loggedIn;

        if (this.loggedIn) {
          this.email = this.autorizacionService.getEmail();
          this.dataService.setCurrentMail(this.email);
        } else {
          this.dataService.setCurrentMail();
        }
      }, () => {
        this.loggedIn = false;
        this.dataService.setCurrentMail();
      });
  }

  public ngOnDestroy() {
    this.subs.forEach( sub => {
      if ( sub && sub.unsubscribe ) {
        sub.unsubscribe();
      }
    });
    this.subs.slice(0, this.subs.length);
  }

  public logOut() {
    this.autorizacionService.logOut();
    this.dataService.setCurrentMail();
    this.email = '';
  }
}

