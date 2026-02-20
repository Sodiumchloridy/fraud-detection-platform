import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  User,
  UserService,
  CreateUserRequest,
  UpdateUserRequest
} from '../../../core/services/user.service';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainLayoutComponent],
  templateUrl: './user-management.component.html',
  styleUrls: []
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  newUser: CreateUserRequest = {
    username: '',
    password: '',
    email: '',
    role: 'ANALYST',
    enabled: true
  };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  createUser(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newUser.username || !this.newUser.password || !this.newUser.email) {
      this.errorMessage = 'Username, password, and email are required';
      return;
    }

    this.userService.createUser(this.newUser).subscribe({
      next: (created) => {
        this.successMessage = 'User created successfully';
        this.users = [...this.users, created];
        this.newUser = {
          username: '',
          password: '',
          email: '',
          role: 'ANALYST',
          enabled: true
        };
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to create user';
      }
    });
  }

  saveUser(user: User): void {
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpdateUserRequest = {
      email: user.email,
      role: user.role as 'ADMIN' | 'ANALYST',
      enabled: user.enabled
    };

    this.userService.updateUser(user.id, payload).subscribe({
      next: () => {
        this.successMessage = `Updated ${user.username}`;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || `Failed to update ${user.username}`;
      }
    });
  }

  deleteUser(user: User): void {
    this.errorMessage = '';
    this.successMessage = '';

    const confirmed = window.confirm(`Delete user \"${user.username}\"?`);
    if (!confirmed) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage = `Deleted ${user.username}`;
        this.users = this.users.filter(u => u.id !== user.id);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || `Failed to delete ${user.username}`;
      }
    });
  }
}
