import { Component } from '@angular/core';

import { AutorizacionService } from '../services/autorizacion.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public registro: { email: string, password: string} = { email: '', password: '' };
  public submitted = false;

  constructor(private autorizacionService: AutorizacionService) { }

  public login() {
    this.autorizacionService.login(this.registro.email, this.registro.password);
  }

  public onSubmit() {
    this.submitted = true;
  }
}
