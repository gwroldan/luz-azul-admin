import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import urljoin from 'url-join';
import 'rxjs/add/operator/toPromise';

class ControlSueldo {
  legajo: number;
  nombre: string;
  sueldo: number;
  sueldoCpras: number;

  constructor(
    legajo: number,
    nombre: string,
    sueldo: number,
    sueldoCpras: number,
  ) {
    this.legajo = legajo;
    this.nombre = nombre;
    this.sueldo = sueldo;
    this.sueldoCpras = sueldoCpras;
  }
}

@Injectable()
export class SueldosService {

  private sueldosUrl: string;

  constructor(private http: HttpClient) {
    // this.stockUrl = urljoin(environment.apiUrl, 'stock');
    this.sueldosUrl = environment.apiUrl + '/sueldos';
  }

  getControlLiquidaciones(mes: number, anio: number): Promise<void | ControlSueldo[]> {
    // const url = urljoin(this.stockUrl, depositoId);
    const url = this.sueldosUrl + `/control?mes=${mes}&anio=${anio}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response as ControlSueldo[])
      .catch(this.handleError);
  }

  handleError(error: any) {
    const errMsg = error.message ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error - Control Liquidaciones';
    console.log(errMsg);
  }
}
