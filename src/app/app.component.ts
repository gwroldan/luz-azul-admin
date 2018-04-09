import { Component } from '@angular/core';

import { AutorizacionService } from './services/autorizacion.service';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public loggedIn = false;
  public email = '';

  constructor(private autorizacionService: AutorizacionService,
              private dataService: DataService) {
    this.autorizacionService.isLogged()
      .subscribe((result) => {
        if (result && result.uid) {
          this.loggedIn = true;
          this.email = this.autorizacionService.getEmail();
          this.dataService.setCurrentMail(this.email);
        } else {
          this.loggedIn = false;
          this.dataService.setCurrentMail();
        }
      }, () => {
        this.loggedIn = false;
        this.dataService.setCurrentMail();
      });
  }

  public logOut() {
    this.autorizacionService.logOut();
    this.dataService.setCurrentMail();
    this.email = '';
  }
}

