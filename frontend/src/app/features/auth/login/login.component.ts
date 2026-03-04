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
  errorMessage = '';

  constructor(
    private router: Router,
    private userService: UserService
  ) { }

  login() {
    this.userService.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        console.error('Login failed:', err);
        this.errorMessage = 'Invalid username or password';
      }
    });
  }
}

