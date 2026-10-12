import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-login-page">
      <div class="login-card">
        <!-- Header -->
        <div class="header text-center mb-6">
          <div class="badge-lock">🔒</div>
          <span class="sub-badge">RESTRICTED ACCESS</span>
          <h1 class="title">Admin Portal Sign In</h1>
          <p class="subtitle">Enter your credentials to access the administrative console</p>
        </div>

        <!-- Clean, Independent Login Form -->
        <form (submit)="onSubmit($event)" autocomplete="off" novalidate>
          <!-- Email / Username Field -->
          <div class="form-group mb-4">
            <label for="admin-username-input" class="label">
              Admin Email or Username
            </label>
            <input
              id="admin-username-input"
              name="adminUsername"
              type="text"
              [(ngModel)]="username"
              required
              autocomplete="off"
              class="input"
              placeholder="Enter admin email or username"
            />
          </div>

          <!-- Password Field -->
          <div class="form-group mb-5">
            <div class="flex-between mb-1">
              <label for="admin-password-input" class="label mb-0">
                Password
              </label>
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="toggle-pw-btn"
                tabindex="-1"
              >
                {{ showPassword() ? 'Hide' : 'Show' }}
              </button>
            </div>
            <input
              id="admin-password-input"
              name="adminPassword"
              [type]="showPassword() ? 'text' : 'password'"
              [(ngModel)]="password"
              required
              autocomplete="off"
              class="input font-mono"
              placeholder="Enter password"
            />
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage()" class="error-box mb-4">
            <span class="mr-1">⚠️</span> {{ errorMessage() }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="submitting() || !username.trim() || !password.trim()"
            class="btn-submit"
          >
            {{ submitting() ? 'Authenticating...' : 'Sign In to Admin Panel &rarr;' }}
          </button>
        </form>

        <!-- Footer -->
        <div class="footer-note text-center mt-6">
          <a href="/" class="return-link">&larr; Return to Storefront</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #090d16;
      padding: 1.5rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 1rem;
      padding: 2.75rem 2.25rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }
    .badge-lock {
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }
    .sub-badge {
      font-size: 0.68rem;
      font-weight: 800;
      color: #f59e0b;
      letter-spacing: 0.15em;
      display: block;
      margin-bottom: 0.35rem;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 0.35rem;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 0.8125rem;
      color: #94a3b8;
      line-height: 1.4;
    }
    .flex-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .form-group {
      position: relative;
    }
    .label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 0.4rem;
      letter-spacing: 0.02em;
    }
    .input {
      width: 100%;
      padding: 0.75rem 0.95rem;
      background: #020617;
      border: 1.5px solid rgba(255, 255, 255, 0.14);
      border-radius: 0.5rem;
      color: #ffffff;
      font-size: 0.875rem;
      box-sizing: border-box;
      transition: all 0.15s ease;
    }
    .input:focus {
      outline: none;
      border-color: #d97706;
      box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
    }
    .toggle-pw-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.725rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
    }
    .toggle-pw-btn:hover {
      color: #d97706;
    }
    .btn-submit {
      width: 100%;
      padding: 0.85rem;
      background: #d97706;
      color: #ffffff;
      font-weight: 800;
      border-radius: 0.5rem;
      border: none;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s ease;
      letter-spacing: 0.01em;
    }
    .btn-submit:hover:not(:disabled) {
      background: #b45309;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
    }
    .btn-submit:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      background: #475569;
    }
    .error-box {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      font-size: 0.775rem;
      padding: 0.65rem 0.85rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
    }
    .return-link {
      color: #64748b;
      font-size: 0.775rem;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.15s;
    }
    .return-link:hover {
      color: #cbd5e1;
    }
    .text-center { text-align: center; }
    .mb-0 { margin-bottom: 0; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-5 { margin-bottom: 1.25rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-6 { margin-top: 1.5rem; }
    .mr-1 { margin-right: 0.35rem; }
  `],
})
export class AdminLoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Clean, empty inputs without default credentials
  username = '';
  password = '';
  showPassword = signal(false);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(e: Event): void {
    e.preventDefault();
    const userVal = this.username?.trim();
    const passVal = this.password?.trim();
    if (!userVal || !passVal) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    // Support both direct email or 'admin' / 'administrator' alias
    let submitEmail = userVal;
    if (['admin', 'administrator', 'root'].includes(userVal.toLowerCase())) {
      submitEmail = 'admin@luxecomm.com';
    }

    this.authService.loginAdmin({ email: submitEmail, password: passVal }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.data.user.role === 'admin' || res.data.user.role === 'manager') {
          this.router.navigate(['/admin/orders']);
        } else {
          this.errorMessage.set('Access denied: Account does not hold administrative privileges.');
        }
      },
      error: (err) => {
        this.submitting.set(false);
        const detail =
          err.error?.errors?.[0]?.message ||
          err.error?.message ||
          'Invalid administrator credentials. Please check Email and Password.';
        this.errorMessage.set(detail);
      },
    });
  }
}
