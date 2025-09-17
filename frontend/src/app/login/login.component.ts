import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './login.component.html',
  styleUrls: []
})
export class LoginComponent {
  constructor(private router: Router) {}

  login() {
    // Simulate login
    this.router.navigate(['/dashboard']);
  }
}

