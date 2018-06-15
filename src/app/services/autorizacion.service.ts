import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFireAuth } from 'angularfire2/auth';
import swal from 'sweetalert2';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Injectable()
export class AutorizacionService {
  public loggedIn = false;
  public logged: BehaviorSubject<boolean>;

  constructor(private angularFireAuth: AngularFireAuth,
              private router: Router) {
    this.isLogged();
    this.logged = new BehaviorSubject(false);

    this.angularFireAuth.authState.subscribe( result => {
      if (result && result.uid) {
        this.loggedIn = true;
        this.logged.next(true);
      } else {
        this.loggedIn = false;
        this.logged.next(false);
      }
    });
  }

  public login = (email, password) => {
    this.angularFireAuth.auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        console.log('Usuario Autorizado');
        this.router.navigate([ '' ]);
      }).catch((err) => {
        let title = 'Error';
        let msj = 'No se pudo generar la Autenticación';
        let typeMsj: any = 'error';

        switch (err.code) {
          case 'auth/user-not-found':
            title = 'Datos Invalidos'
            msj = 'El Email ingresado es incorrecto o no se encuentra registrado';
            typeMsj = 'info';
            break;
          case 'auth/wrong-password':
            title = 'Datos Invalidos'
            msj = 'El Password ingresado es incorrecto';
            typeMsj = 'info';
            break;
        }

        swal(title, msj, typeMsj);
        console.log('Error de Autenticacion:', err);
      });
  }

  public isLogged() {
    return this.angularFireAuth.authState;
  }

  public logOut() {
    this.angularFireAuth.auth.signOut()
      .then(() => {
        this.router.navigate([ '/login' ]).catch();
      });
  }

  public getEmail() {
    return this.angularFireAuth.auth.currentUser.email;
  }
}
