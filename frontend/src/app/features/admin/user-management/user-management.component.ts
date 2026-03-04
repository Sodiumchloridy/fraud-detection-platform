import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
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
  imports: [CommonModule, FormsModule, RouterLink, MainLayoutComponent],
  templateUrl: './user-management.component.html',
  styleUrls: []
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  newUser: CreateUserRequest = this.emptyUser();

  private emptyUser(): CreateUserRequest {
    return { username: '', password: '', email: '', role: 'ANALYST', enabled: true };
  }

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private extractError(err: any, fallback: string): string {
    return err?.error?.message || fallback;
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService.getAllUsers().pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (users) => this.users = users,
      error: (err) => this.errorMessage = this.extractError(err, 'Failed to load users')
    });
  }

  createUser(): void {
    this.clearMessages();

    if (!this.newUser.username || !this.newUser.password || !this.newUser.email) {
      this.errorMessage = 'Username, password, and email are required';
      return;
    }

    this.userService.createUser(this.newUser).subscribe({
      next: (created) => {
        this.successMessage = 'User created successfully';
        this.users = [...this.users, created];
        this.newUser = this.emptyUser();
      },
      error: (err) => this.errorMessage = this.extractError(err, 'Failed to create user')
    });
  }

  saveUser(user: User): void {
    this.clearMessages();

    const payload: UpdateUserRequest = {
      email: user.email,
      role: user.role as 'ADMIN' | 'ANALYST',
      enabled: user.enabled
    };

    this.userService.updateUser(user.id, payload).subscribe({
      next: () => this.successMessage = `Updated ${user.username}`,
      error: (err) => this.errorMessage = this.extractError(err, `Failed to update ${user.username}`)
    });
  }

  deleteUser(user: User): void {
    this.clearMessages();
    if (!confirm(`Delete user "${user.username}"?`)) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage = `Deleted ${user.username}`;
        this.users = this.users.filter(u => u.id !== user.id);
      },
      error: (err) => this.errorMessage = this.extractError(err, `Failed to delete ${user.username}`)
    });
  }
}
