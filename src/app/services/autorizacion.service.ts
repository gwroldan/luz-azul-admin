import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AngularFireAuth } from 'angularfire2/auth';
import swal from 'sweetalert2';

@Injectable()
export class AutorizacionService {

  constructor(private angularFireAuth: AngularFireAuth, private router: Router) {
    this.isLogged();
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
