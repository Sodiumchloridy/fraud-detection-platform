import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-create.component.html',
  styleUrls: []
})
export class UserCreateComponent {
  user = {
    name: '',
    email: '',
    role: 'Fraud Analyst'
  };

  constructor(private router: Router) {}

  createUser() {
    // Here you would typically send the user data to a server
    console.log('Creating user:', this.user);
    alert('New user account created (simulation).');
    this.router.navigate(['/admin']);
  }
}

