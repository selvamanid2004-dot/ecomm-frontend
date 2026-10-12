import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="auth-page py-5">
      <div class="container max-w-md">
        <div class="auth-card card p-5">
          <div class="text-center mb-4">
            <span class="text-xs font-bold text-brand uppercase tracking-widest block mb-1">SIGN IN</span>
            <h1 class="text-2xl font-extrabold">Welcome Back</h1>
            <p class="text-xs text-muted">Access your account, orders, and curated wishlist.</p>
          </div>


          <form (submit)="onSubmit($event)">
            <div class="form-group mb-3">
              <label class="form-label">Email Address</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                class="form-control"
                placeholder="name@example.com"
              />
            </div>

            <div class="form-group mb-4">
              <label class="form-label flex-between">
                <span>Password</span>
              </label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                class="form-control"
                placeholder="••••••••"
              />
            </div>

            <div *ngIf="errorMessage()" class="alert-box mb-3 text-xs text-danger">
              {{ errorMessage() }}
            </div>

            <button type="submit" [disabled]="submitting() || !email || !password" class="btn btn-primary btn-lg w-full mb-3">
              {{ submitting() ? 'Verifying Credentials...' : 'Sign In' }}
            </button>
          </form>

          <div class="text-center text-xs text-muted mt-3">
            Don't have an account?
            <a routerLink="/auth/register" class="text-brand font-bold hover:underline">Create Account</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .max-w-md { max-width: 440px; margin-left: auto; margin-right: auto; }
    .bg-subtle { background: var(--color-surface-subtle); }
    .btn-xs { padding: 0.35rem 0.5rem; font-size: 0.75rem; }
    .alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 0.65rem;
      border-radius: var(--radius-sm);
    }
    .w-full { width: 100%; }
    .py-5 { padding-top: 4rem; padding-bottom: 4rem; }
  `],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  fillCustomer(): void {
    this.email = 'sophia.chen@example.com';
    this.password = 'Password@123';
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    if (!this.email || !this.password) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.data.user.role === 'admin' || res.data.user.role === 'manager') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/account']);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid email or password');
      },
    });
  }
}
