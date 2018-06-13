import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import urljoin from 'url-join';
import 'rxjs/add/operator/toPromise';

class Stock {
  depositoId: number;
  productoId: string;
  stockActual: number;

  constructor(
    depositoId: number,
    productoId: string,
    stockActual: number
  ) {
    this.depositoId = depositoId;
    this.productoId = productoId;
    this.stockActual = stockActual;
  }
}

@Injectable()
export class StockService {

  private stockUrl: string;

  constructor(private http: HttpClient) {
    // this.stockUrl = urljoin(environment.apiUrl, 'stock');
    this.stockUrl = environment.apiUrl + '/stock';
  }

  getStock(depositoId): Promise<void | Stock[]> {
    // const url = urljoin(this.stockUrl, depositoId);
    const url = this.stockUrl + '/' + depositoId;
    return this.http.get(url)
      .toPromise()
      .then(response => response as Stock[])
      .catch(this.handleError);
  }

  handleError(error: any) {
    const errMsg = error.message ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.log(errMsg);
  }
}
