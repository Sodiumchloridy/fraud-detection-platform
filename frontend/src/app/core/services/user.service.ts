import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  enabled: boolean;
  promptChangePassword?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  username: string;
  role: string;
  email: string;
  twoFactorRequired?: boolean;
  preAuthToken?: string;
  twoFactorEnabled?: boolean;
  promptChangePassword?: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUri: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  role: 'ADMIN' | 'ANALYST';
  enabled: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  role?: 'ADMIN' | 'ANALYST';
  enabled?: boolean;
  password?: string;
  promptChangePassword?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api';
  private currentUser$ = new BehaviorSubject<LoginResponse | null>(null);

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser$.next(JSON.parse(stored));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (!response.twoFactorRequired) this.storeSession(response);
      })
    );
  }

  verify2fa(token: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/verify-2fa`, { token, code }).pipe(
      tap(response => this.storeSession(response))
    );
  }

  setup2fa(): Observable<TwoFactorSetup> {
    return this.http.get<TwoFactorSetup>(`${this.apiUrl}/auth/2fa/setup`);
  }

  confirm2fa(code: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/2fa/confirm`, { code }).pipe(
      tap(() => this.updateStoredUser({ twoFactorEnabled: true }))
    );
  }

  disable2fa(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/auth/2fa`).pipe(
      tap(() => this.updateStoredUser({ twoFactorEnabled: false }))
    );
  }

  private storeSession(response: LoginResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('currentUser', JSON.stringify(response));
    this.currentUser$.next(response);
  }

  private updateStoredUser(patch: Partial<LoginResponse>): void {
    const user = this.getCurrentUser();
    if (user) {
      const updated = { ...user, ...patch };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      this.currentUser$.next(updated);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUser$.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): LoginResponse | null {
    return this.currentUser$.value;
  }

  getCurrentUser$(): Observable<LoginResponse | null> {
    return this.currentUser$.asObservable();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isAnalyst(): boolean {
    return this.hasRole('ANALYST');
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  createUser(payload: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, payload);
  }

  updateUser(userId: number, payload: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}`, payload);
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }

  changePassword(credential: string, newPassword: string, useOtp: boolean): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/change-password`, { credential, newPassword, useOtp }).pipe(
      tap(() => this.updateStoredUser({ promptChangePassword: false }))
    );
  }
}
