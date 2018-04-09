import { Injectable } from '@angular/core';

@Injectable()
export class DataService {
  private currentMail: string;
  private configuracion = {
    barracas: {
      cantFilesLoad: 9
    },
    olavarria: {
      cantFilesLoad: 10
    },
    proveedores: ['Cagnoli', 'Festa', 'Fox', 'Luz Azul', 'Morando',
      'Otros de Terceros', 'Pannet', 'Papelera y Grafica', 'Pieres',
      'Tapalque', 'Tapamania']
  };

  public setCurrentMail(email?: string) {
    this.currentMail = email;
  }

  public getCantFilesLoad() {
    switch (this.currentMail) {
      case 'depositoolavarria@luz-azul.com.ar': return this.configuracion.olavarria.cantFilesLoad;
      case 'expedicionbarracas@luz-azul.com.ar': return this.configuracion.barracas.cantFilesLoad;
      case 'pedidosbarracas@luz-azul.com.ar': return this.configuracion.barracas.cantFilesLoad;
      case 'gustavowroldan@gmail.com': return this.configuracion.olavarria.cantFilesLoad;
    }
  }

  public getProveedores() {
    return this.configuracion.proveedores;
  }
}
