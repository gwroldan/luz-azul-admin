import { Injectable } from '@angular/core';

import * as firebase from 'firebase';
import 'firebase/firestore';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Router} from '@angular/router';

@Injectable()
export class DataService {
  private db: any;
  private currentMail: string;

  private usuario: {
    email: string,
    deposito: string,
    cantFilesLoad: number
  };

  private proveedores: {
    nombre: string,
    multiplicador: number
  }[] = [];

  public valueDatosUsuario: BehaviorSubject<any> = new BehaviorSubject(null);
  public valueProveedores: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(private router: Router) {
    this.db = firebase.firestore();
    this.db.settings({timestampsInSnapshots: true});
    this.db.enablePersistence().catch((err) => {
      if (err.code === 'failed-precondition') {
        console.log('Solo se puede utilizar la cache en la primer pestaña...');
      } else if (err.code === 'unimplemented') {
        console.log('El navegador no soporta esta caracteristica...');
      }
    });

    this.db.collection('usuarios')
      .onSnapshot({
        // Listen for document metadata changes
        includeQueryMetadataChanges: true,
        includeDocumentMetadataChanges: true
      }, (docs) => {
        // console.log(docs);
        // console.log(docs.metadata.fromCache);
        docs.forEach((docSnap: any) => {
          const doc = docSnap.data();
          if (docSnap.id === this.currentMail) {
            this.usuario = {
              email: docSnap.id,
              deposito: doc.deposito,
              cantFilesLoad: doc.cantFilesLoad
            };
            this.valueDatosUsuario.next(this.usuario);
          }
        });
      });

    this.db.collection('proveedores').orderBy('nombre').onSnapshot((docs) => {
      const proveedores = [];
      docs.forEach((doc: any) => {
        proveedores.push({
          nombre: doc.data().nombre,
          multiplicador: doc.data().multiplicadorPed
        });
      });
      this.proveedores = proveedores;
      this.valueProveedores.next(proveedores);
    });
  }

  public setCurrentMail(email?: string) {
    this.currentMail = email;
  }


  public async refreshALoBruto( path ) {
    await this.router.navigate(['/blank']);
    await this.router.navigate(path);
  }
}
