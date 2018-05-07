import { Injectable } from '@angular/core';

import * as firebase from 'firebase';
import 'firebase/firestore';

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
    if (this.usuario && this.usuario !== {}) {
      return new Promise((resolve) => {
        resolve(this.usuario);
      });
    } else {
      return this.db.collection('usuarios').get()
        .then((docs) => {
          docs.forEach((doc: any) => {
            if (doc.id === this.currentMail) {
              this.usuario = {
                email: doc.id,
                deposito: doc.data().deposito,
                cantFilesLoad: doc.data().cantFilesLoad
              };
            }
          });

          return this.usuario;
        });
    }
  }

  public getProveedores(): Promise<any> {
    if (this.proveedores && this.proveedores.length > 0) {
      return new Promise((resolve) => {
        resolve(this.proveedores);
      });
    } else {
      return this.db.collection('proveedores').orderBy('nombre').get()
        .then((docs) => {
          docs.forEach((doc: any) => {
            this.proveedores.push({
              nombre: doc.data().nombre,
              multiplicador: doc.data().multiplicadorPed
            });
          });

          return this.proveedores;
        });
    }
  }
}
