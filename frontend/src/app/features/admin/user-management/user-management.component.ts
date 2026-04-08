import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  templateUrl: './user-management.component.html',
  styleUrls: []
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  modalError = '';
  searchQuery = '';

  showAddModal = false;
  showEditModal = false;
  editingUser: User | null = null;
  generatedPassword = '';
  generatedPasswordError = '';
  generatedPasswordCopied = false;

  newUser: CreateUserRequest = this.emptyUser();

  get filteredUsers(): User[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.users;
    return this.users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }

  private emptyUser(): CreateUserRequest {
    return { username: '', password: '', email: '', role: 'ANALYST', enabled: true };
  }

  constructor(private userService: UserService, private location: Location) {}

  goBack() { this.location.back(); }

  ngOnInit(): void {
    this.loadUsers();
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
    this.modalError = '';
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

  openAddModal(): void {
    this.newUser = this.emptyUser();
    this.modalError = '';
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.modalError = '';
  }

  openEditModal(user: User): void {
    this.editingUser = { ...user };
    this.modalError = '';
    this.generatedPassword = '';
    this.generatedPasswordError = '';
    this.generatedPasswordCopied = false;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
    this.modalError = '';
    this.generatedPassword = '';
    this.generatedPasswordError = '';
    this.generatedPasswordCopied = false;
  }

  get canResetEditingUserPassword(): boolean {
    const current = this.userService.getCurrentUser();
    return !!this.editingUser && this.editingUser.username !== current?.username;
  }

  generateTempPassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    this.generatedPassword = Array.from(array, b => chars[b % chars.length]).join('');
    this.generatedPasswordCopied = false;
    this.generatedPasswordError = '';
  }

  copyGeneratedPassword(): void {
    if (!this.generatedPassword) return;
    navigator.clipboard.writeText(this.generatedPassword).then(() => {
      this.generatedPasswordCopied = true;
      setTimeout(() => this.generatedPasswordCopied = false, 2000);
    });
  }

  applyPasswordReset(): void {
    if (!this.editingUser || !this.generatedPassword) return;
    this.generatedPasswordError = '';

    this.userService.updateUser(this.editingUser.id, {
      password: this.generatedPassword,
      promptChangePassword: true
    }).subscribe({
      next: () => {
        this.successMessage = `Password reset for ${this.editingUser!.username}. They will be prompted to change it on next login.`;
        this.closeEditModal();
      },
      error: (err) => this.generatedPasswordError = this.extractError(err, 'Failed to reset password')
    });
  }

  createUser(): void {
    this.modalError = '';

    if (!this.newUser.username || !this.newUser.password || !this.newUser.email) {
      this.modalError = 'Username, password, and email are required';
      return;
    }

    this.userService.createUser(this.newUser).subscribe({
      next: (created) => {
        this.successMessage = 'User created successfully';
        this.users = [...this.users, created];
        this.closeAddModal();
      },
      error: (err) => this.modalError = this.extractError(err, 'Failed to create user')
    });
  }

  saveUser(): void {
    if (!this.editingUser) return;
    this.modalError = '';

    const payload: UpdateUserRequest = {
      email: this.editingUser.email,
      role: this.editingUser.role as 'ADMIN' | 'ANALYST',
      enabled: this.editingUser.enabled
    };

    this.userService.updateUser(this.editingUser.id, payload).subscribe({
      next: () => {
        this.successMessage = `Updated ${this.editingUser!.username}`;
        this.users = this.users.map(u => u.id === this.editingUser!.id ? { ...this.editingUser! } : u);
        this.closeEditModal();
      },
      error: (err) => this.modalError = this.extractError(err, `Failed to update ${this.editingUser?.username}`)
    });
  }

  toggleUserStatus(user: User): void {
    this.clearMessages();
    const payload: UpdateUserRequest = {
      email: user.email,
      role: user.role as 'ADMIN' | 'ANALYST',
      enabled: !user.enabled
    };

    this.userService.updateUser(user.id, payload).subscribe({
      next: () => {
        user.enabled = !user.enabled;
        this.successMessage = `${user.username} is now ${user.enabled ? 'active' : 'inactive'}`;
      },
      error: (err) => this.errorMessage = this.extractError(err, `Failed to update ${user.username}`)
    });
  }

  deleteUser(user: User): void {
    this.clearMessages();
    if (user.username === 'admin') {
      this.errorMessage = 'The root admin account cannot be deleted.';
      return;
    }
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
