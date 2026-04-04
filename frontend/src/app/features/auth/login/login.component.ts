import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, LoginRequest } from '../../../core/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: []
})
export class LoginComponent {
  username = '';
  password = '';
  code = '';
  errorMessage = '';
  preAuthToken = '';
  showTwoFactor = false;

  constructor(
    private router: Router,
    private userService: UserService
  ) { }

  login() {
    this.errorMessage = '';
    this.userService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        if (res.twoFactorRequired) {
          this.preAuthToken = res.preAuthToken!;
          this.showTwoFactor = true;
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => this.errorMessage = 'Invalid username or password'
    });
  }

  verify() {
    this.errorMessage = '';
    this.userService.verify2fa(this.preAuthToken, this.code).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.errorMessage = 'Invalid verification code'
    });
  }

  backToLogin() {
    this.showTwoFactor = false;
    this.code = '';
    this.errorMessage = '';
  }
}

