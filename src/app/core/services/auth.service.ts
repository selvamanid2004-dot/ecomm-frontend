import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../models/ecommerce.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Separate session keys to prevent customer & admin session collisions
  private readonly CUSTOMER_TOKEN_KEY = 'luxe_customer_token';
  private readonly CUSTOMER_USER_KEY = 'luxe_customer_profile';
  private readonly ADMIN_TOKEN_KEY = 'luxe_admin_token';
  private readonly ADMIN_USER_KEY = 'luxe_admin_profile';

  currentCustomer = signal<User | null>(this.getStoredCustomer());
  currentAdmin = signal<User | null>(this.getStoredAdmin());
  currentUser = signal<User | null>(this.getStoredCustomer() || this.getStoredAdmin());

  isAuthenticated = computed(() => !!this.currentCustomer() || !!this.currentAdmin());
  isAdmin = computed(() => this.currentAdmin()?.role === 'admin' || this.currentAdmin()?.role === 'manager');
  isCustomerAuthenticated = computed(() => !!this.currentCustomer());

  constructor(private http: HttpClient, private router: Router) {
    this.migrateLegacySession();
  }

  login(credentials: { email: string; password: string }): Observable<{ success: boolean; data: AuthResponse }> {
    return this.http.post<{ success: boolean; data: AuthResponse }>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.data) {
          if (res.data.user.role === 'admin' || res.data.user.role === 'manager') {
            this.setAdminSession(res.data);
          } else {
            this.setCustomerSession(res.data);
          }
        }
      })
    );
  }

  loginAdmin(credentials: { email: string; password: string }): Observable<{ success: boolean; data: AuthResponse }> {
    return this.http.post<{ success: boolean; data: AuthResponse }>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setAdminSession(res.data);
        }
      })
    );
  }

  register(data: any): Observable<{ success: boolean; data: AuthResponse }> {
    return this.http.post<{ success: boolean; data: AuthResponse }>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setCustomerSession(res.data);
        }
      })
    );
  }

  logout(): void {
    this.logoutCustomer();
  }

  logoutCustomer(): void {
    localStorage.removeItem(this.CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(this.CUSTOMER_USER_KEY);
    localStorage.removeItem('luxe_session_id');
    this.currentCustomer.set(null);
    this.currentUser.set(this.currentAdmin());
  }

  logoutAdmin(): void {
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
    localStorage.removeItem(this.ADMIN_USER_KEY);
    this.currentAdmin.set(null);
    this.currentUser.set(this.currentCustomer());
    this.router.navigate(['/admin/login']);
  }

  getCustomerToken(): string | null {
    return localStorage.getItem(this.CUSTOMER_TOKEN_KEY);
  }

  getAdminToken(): string | null {
    return localStorage.getItem(this.ADMIN_TOKEN_KEY);
  }

  getToken(): string | null {
    return this.getCustomerToken() || this.getAdminToken();
  }

  private setCustomerSession(auth: AuthResponse): void {
    localStorage.setItem(this.CUSTOMER_TOKEN_KEY, auth.accessToken);
    localStorage.setItem(this.CUSTOMER_USER_KEY, JSON.stringify(auth.user));
    this.currentCustomer.set(auth.user);
    this.currentUser.set(auth.user);
  }

  private setAdminSession(auth: AuthResponse): void {
    localStorage.setItem(this.ADMIN_TOKEN_KEY, auth.accessToken);
    localStorage.setItem(this.ADMIN_USER_KEY, JSON.stringify(auth.user));
    this.currentAdmin.set(auth.user);
    if (!this.currentCustomer()) {
      this.currentUser.set(auth.user);
    }
  }

  private getStoredCustomer(): User | null {
    const token = localStorage.getItem(this.CUSTOMER_TOKEN_KEY);
    if (!token) return null;
    try {
      const json = localStorage.getItem(this.CUSTOMER_USER_KEY);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }

  private getStoredAdmin(): User | null {
    const token = localStorage.getItem(this.ADMIN_TOKEN_KEY);
    if (!token) return null;
    try {
      const json = localStorage.getItem(this.ADMIN_USER_KEY);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }

  private migrateLegacySession(): void {
    try {
      const oldToken = localStorage.getItem('luxe_access_token');
      const oldUserStr = localStorage.getItem('luxe_user_profile');
      if (oldToken && oldUserStr) {
        const oldUser = JSON.parse(oldUserStr);
        if (oldUser.role === 'admin' || oldUser.role === 'manager') {
          if (!this.getAdminToken()) {
            localStorage.setItem(this.ADMIN_TOKEN_KEY, oldToken);
            localStorage.setItem(this.ADMIN_USER_KEY, oldUserStr);
            this.currentAdmin.set(oldUser);
          }
        } else {
          if (!this.getCustomerToken()) {
            localStorage.setItem(this.CUSTOMER_TOKEN_KEY, oldToken);
            localStorage.setItem(this.CUSTOMER_USER_KEY, oldUserStr);
            this.currentCustomer.set(oldUser);
          }
        }
      }
    } catch {}
  }
}
