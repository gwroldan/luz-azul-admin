import { Injectable } from '@angular/core';

import * as firebase from 'firebase';
import 'firebase/firestore';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class DataService {
  private db: any;
  private currentMail: string;

  private usuario: {
    email: string,
    deposito: string,
    depositoId: number,
    cantFilesLoad: number
  };

  private proveedores: {
    nombre: string,
    multiplicador: number
  }[] = [];

  public valueDatosUsuario: BehaviorSubject<any> = new BehaviorSubject(null);
  public valueProveedores: BehaviorSubject<any> = new BehaviorSubject(null);


  constructor(private router: Router) {
    this.setNuevoUsuarioActivo(null, null);

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
            this.setNuevoUsuarioActivo(docSnap.id, doc);
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

  public async setCurrentMail(email?: string) {
    if ( this.usuario.email !== email ) {
      if ( email ) {
        const usuarioSnap = await this.db.collection('usuarios').doc(email).get();
        const usuario = usuarioSnap.data();
        this.setNuevoUsuarioActivo(email, usuario);
      } else {
        // Limpiar
        this.setNuevoUsuarioActivo(null, null);
      }
      this.currentMail = email;
    }
  }

  public setNuevoUsuarioActivo(id, doc) {
    this.usuario = {
      email: id,
      deposito: null,
      depositoId: null,
      cantFilesLoad: null
    };
    if ( doc ) {
      this.usuario.deposito = doc.deposito;
      this.usuario.depositoId = doc.depositoId;
      this.usuario.cantFilesLoad = doc.cantFilesLoad;
    }
    this.valueDatosUsuario.next(this.usuario);
  }


  public async refreshALoBruto( path ) {
    await this.router.navigate(['/blank']);
    await this.router.navigate(path);
  }
}
