import { Component } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  login = false;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.login = !!this.api.authToken;
  }

  loginChanged(loggedIn: boolean) {
    this.login = loggedIn;
  }

}
