import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { AutorizacionService } from './autorizacion.service';

@Injectable()
export class MyGuardService implements CanActivate {


  constructor(private autorizacionService: AutorizacionService) {
  }

  canActivate(): Promise<boolean> {
    if ( this.autorizacionService.loggedIn === false ) {
      return new Promise( resolve => {
        setTimeout( () => {
          resolve( !!this.autorizacionService.loggedIn );
        }, 1500);
      });
    }
    return Promise.resolve(!!this.autorizacionService.loggedIn);
  }
}
