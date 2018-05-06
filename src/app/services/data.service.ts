import { Injectable } from '@angular/core';

import * as firebase from 'firebase';
import 'firebase/firestore';

@Injectable()
export class DataService {
  private db: any;
  private currentMail: string;

  constructor() {
    this.db = firebase.firestore();
    this.db.settings({timestampsInSnapshots: true});
    this.db.enablePersistence().catch((err) => {
      if (err.code === 'failed-precondition') {
        console.log('Solo se puede utilizar la cache en la primer pestaña...');
      } else if (err.code === 'unimplemented') {
        console.log('El navegador no soporta esta caracteristica...');
      }
    });
  }

  public setCurrentMail(email?: string) {
    this.currentMail = email;
  }

  public getDatosUsuario() {
    return this.db.collection('usuarios').get()
      .then((docs) => {
        const parametros = [];
        docs.forEach((doc: any) => {
          if (doc.id === this.currentMail) {
            parametros.push(doc.data().cantFilesLoad);
            parametros.push(doc.data().deposito);
          }
        });

        return parametros;
      });
  }

  public getProveedores(): Promise<any> {
    return this.db.collection('proveedores').orderBy('nombre').get()
      .then((docs) => {
        const proveedores = [];
        docs.forEach((doc: any) => {
          proveedores.push({
            nombre: doc.data().nombre,
            multiplicador: doc.data().multiplicadorPed
          });
        });

        return proveedores;
      });
  }
}
