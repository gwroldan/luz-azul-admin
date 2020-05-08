import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import 'rxjs/add/operator/toPromise';
import {Observable} from 'rxjs/Observable';

class Stock {
  depositoId: number;
  productoId: string;
  stockActual: number;

  constructor(depositoId: number, productoId: string, stockActual: number) {
    this.depositoId = depositoId;
    this.productoId = productoId;
    this.stockActual = stockActual;
  }
}

class ListaPrecios {
  listaPrecioId: number;
  productoId: string;
  descProducto: string;
  precio: number;

  constructor(listaPrecioId: number, productoId: string, descProducto: string, precio: number) {
    this.listaPrecioId = listaPrecioId;
    this.productoId = productoId;
    this.descProducto = descProducto;
    this.precio = precio;
  }
}

@Injectable()
export class ProductosService {
  private stockUrl: string;
  private listaPreciosUrl: string;

  constructor(private http: HttpClient) {
    this.stockUrl = environment.apiUrl + '/stock';
    this.listaPreciosUrl = environment.apiUrl + '/lista-precios';
  }

  getStock(depositoId): Promise<void | Stock[]> {
    const url = this.stockUrl + '/' + depositoId;
    return this.http.get(url)
      .toPromise()
      .then(response => response as Stock[])
      .catch(this.handleError);
  }

  /*getListaPrecios(listaPrecioId): Promise<void | ListaPrecios[]> {
    const url = this.listaPreciosUrl + '/' + listaPrecioId;
    return this.http.get(url)
      .toPromise()
      .then(response => response as ListaPrecios[])
      .catch(this.handleError);
  }*/

  getListaPrecios(listaPrecioId): Observable<ListaPrecios[]> {
    const url = this.listaPreciosUrl + '/' + listaPrecioId;
    return this.http.get<ListaPrecios[]>(url);
  }

  handleError(error: any) {
    const errMsg = error.message ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.log(errMsg);
  }
}
