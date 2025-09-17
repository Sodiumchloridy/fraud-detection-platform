import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styles: []
})
export class AdminDashboardComponent {
  users: User[] = [
    { id: 1, name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Administrator' },
    { id: 2, name: 'Bob Williams', email: 'bob.w@example.com', role: 'Fraud Analyst' }
  ];
}

