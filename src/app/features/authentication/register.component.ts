import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="auth-page py-5">
      <div class="container max-w-md">
        <div class="auth-card card p-5">
          <div class="text-center mb-4">
            <span class="text-xs font-bold text-brand uppercase tracking-widest block mb-1">MEMBERSHIP</span>
            <h1 class="text-2xl font-extrabold">Create Account</h1>
            <p class="text-xs text-muted">Join the Luxe Studio collector community.</p>
          </div>

          <form (submit)="onSubmit($event)">
            <div class="flex gap-2 mb-3">
              <div class="form-group flex-1">
                <label class="form-label text-xs">First Name</label>
                <input type="text" [(ngModel)]="firstName" name="firstName" required class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label text-xs">Last Name</label>
                <input type="text" [(ngModel)]="lastName" name="lastName" required class="form-control" />
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="form-label text-xs">Email Address</label>
              <input type="email" [(ngModel)]="email" name="email" required class="form-control" />
            </div>

            <div class="form-group mb-3">
              <label class="form-label text-xs">Phone Number (Optional)</label>
              <input type="tel" [(ngModel)]="phone" name="phone" class="form-control" />
            </div>

            <div class="form-group mb-4">
              <label class="form-label text-xs">Password (Min 8 chars, 1 uppercase, 1 digit)</label>
              <input type="password" [(ngModel)]="password" name="password" required class="form-control" />
            </div>

            <div *ngIf="errorMessage()" class="alert-box mb-3 text-xs text-danger">
              {{ errorMessage() }}
            </div>

            <button type="submit" [disabled]="submitting()" class="btn btn-primary btn-lg w-full mb-3">
              {{ submitting() ? 'Creating Profile...' : 'Complete Registration' }}
            </button>
          </form>

          <div class="text-center text-xs text-muted mt-3">
            Already have an account?
            <a routerLink="/auth/login" class="text-brand font-bold hover:underline">Sign In</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 4rem);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 1rem;
    }
    .max-w-md { max-width: 440px; width: 100%; margin-left: auto; margin-right: auto; }
    .auth-card { width: 100%; }
    .alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 0.65rem;
      border-radius: var(--radius-sm);
    }
    .w-full { width: 100%; }
  `],
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';

  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(e: Event): void {
    e.preventDefault();
    if (!this.email || !this.password || !this.firstName || !this.lastName) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.authService
      .register({
        first_name: this.firstName,
        last_name: this.lastName,
        email: this.email,
        phone: this.phone || undefined,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/account']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed');
        },
      });
  }
}
