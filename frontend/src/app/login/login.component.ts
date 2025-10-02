import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: []
})

export class LoginComponent {
  constructor(private router: Router) { }

  login() {
    // ngSubmit now triggers via FormsModule and prevents full page reload
    this.router.navigate(['/dashboard']);
  }
}

