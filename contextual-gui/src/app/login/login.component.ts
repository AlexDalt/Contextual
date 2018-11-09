import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ApiService } from '../services/api.service';
import { NgForm, NgModel } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  creating: boolean = false;

  name: string;

  @ViewChild('nameField') nameField: ElementRef;

  @ViewChild('email') email: NgModel;
  @ViewChild('emailField') emailField: ElementRef;

  @ViewChild('password') password: NgModel;

  @Output('login') login: EventEmitter<void> = new EventEmitter<void>();

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.emailField.nativeElement.focus();
  }

  submit(form: NgForm) {
    if (this.creating) {
      this.api.createAccount(this.name, this.email.value, this.password.value).then(() => {
        this.login.emit();
      }).catch(() => {
        form.form.controls['email'].setErrors({'exists': true});
      });
    } else {
      this.api.logIn(this.email.value, this.password.value).then(() => {
        this.login.emit();
      }).catch(() => {
        form.form.controls['password'].setErrors({'incorrect': true});
      });
    }
  }

  swap() {
    if (this.creating) {
      this.creating = false;
    } else {
      this.creating = true;
      setTimeout(() => {
        this.nameField.nativeElement.focus();
      }, 1);
    }
  }

}
