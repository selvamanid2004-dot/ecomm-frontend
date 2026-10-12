import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-shell">
      <!-- Mobile Backdrop -->
      <div
        class="sidebar-backdrop"
        *ngIf="sidebarOpen()"
        (click)="sidebarOpen.set(false)"
      ></div>

      <!-- Admin Sidebar -->
      <aside class="admin-sidebar" [class.mobile-open]="sidebarOpen()">
        <div class="sidebar-brand">
          <div class="flex items-center gap-2">
            <span class="logo-accent">LUXE</span>
            <span class="badge badge-gold">ADMIN</span>
          </div>
          <button (click)="sidebarOpen.set(false)" class="mobile-close-btn lg-hidden" title="Close sidebar">
            &times;
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-title">ADMINISTRATION</div>

          <a
            routerLink="/admin/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>

          <a
            routerLink="/admin/orders"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon">🛍️</span>
            <span>Orders</span>
          </a>

          <a
            routerLink="/admin/customers"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon">👥</span>
            <span>Customers</span>
          </a>

          <a
            routerLink="/admin/products"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon">📦</span>
            <span>Products</span>
          </a>

          <a
            routerLink="/admin/add-product"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon">➕</span>
            <span>Add Product</span>
          </a>

          <a
            routerLink="/admin/pricing"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon">🏷️</span>
            <span>Price Management</span>
          </a>

          <a
            routerLink="/admin/content"
            routerLinkActive="active"
            (click)="onNavClick()"
            class="nav-item"
          >
            <span class="nav-icon">✍️</span>
            <span>Website Content Management</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="admin-user-pill">
            <div class="avatar">
              {{ (authService.currentAdmin() || authService.currentUser())?.first_name?.charAt(0) || 'A' }}
            </div>
            <div class="user-meta">
              <span class="name">
                {{ (authService.currentAdmin() || authService.currentUser())?.first_name }}
                {{ (authService.currentAdmin() || authService.currentUser())?.last_name }}
              </span>
              <span class="role">
                {{ (authService.currentAdmin() || authService.currentUser())?.role | uppercase }}
              </span>
            </div>
          </div>
          <button (click)="authService.logoutAdmin()" class="btn-logout" title="Sign out administrator">
            ⏻
          </button>
        </div>
      </aside>

      <!-- Admin Main Content Area -->
      <div class="admin-main">
        <header class="admin-header">
          <div class="header-left flex items-center gap-3">
            <button
              (click)="sidebarOpen.set(!sidebarOpen())"
              class="hamburger-btn"
              title="Toggle sidebar menu"
            >
              ☰
            </button>
            <div class="system-status">
              <span class="pulse-dot"></span>
              <span class="status-text">Production Operations &bull; Live &amp; Connected</span>
            </div>
          </div>

          <div class="header-right flex items-center gap-3">
            <a routerLink="/" target="_blank" class="btn btn-secondary btn-xs text-xs font-bold" title="Open Storefront in new tab">
              Storefront ↗
            </a>
            <div class="admin-badge-chip">
              <span class="text-xs text-slate-500">Admin:</span>
              <strong class="text-xs text-slate-800">{{ (authService.currentAdmin() || authService.currentUser())?.email }}</strong>
            </div>
          </div>
        </header>

        <main class="admin-content-body">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
      color: #0f172a;
      position: relative;
    }

    .admin-sidebar {
      width: 260px;
      background: #0f172a;
      border-right: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      z-index: 50;
      transition: transform 0.25s ease-in-out;
    }

    .sidebar-brand {
      height: 4.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .logo-accent {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #ffffff;
    }

    .mobile-close-btn {
      color: #94a3b8;
      font-size: 1.5rem;
      padding: 0.25rem 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
    }
    .mobile-close-btn:hover { color: #ffffff; }

    .sidebar-nav {
      flex: 1;
      padding: 1.25rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-section-title {
      font-size: 0.675rem;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.08em;
      padding: 0.5rem 0.75rem 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      color: #94a3b8;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
    }

    .nav-item.active {
      background: #d97706;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.35);
    }

    .nav-icon {
      font-size: 1rem;
      width: 1.25rem;
      text-align: center;
    }

    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #090d16;
    }

    .admin-user-pill {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      overflow: hidden;
    }

    .avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: #d97706;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.825rem;
      flex-shrink: 0;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-meta .name {
      font-size: 0.8rem;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-meta .role {
      font-size: 0.625rem;
      color: #94a3b8;
      font-weight: 700;
    }

    .btn-logout {
      color: #94a3b8;
      font-size: 1.15rem;
      padding: 0.35rem;
      border-radius: 6px;
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.15s;
    }
    .btn-logout:hover { color: #ef4444; }

    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow-y: auto;
    }

    .admin-header {
      height: 4.25rem;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .hamburger-btn {
      display: none;
      font-size: 1.35rem;
      color: #334155;
      background: none;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      line-height: 1;
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    .status-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }

    .admin-badge-chip {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .admin-content-body {
      flex: 1;
      padding: 1.75rem 2rem;
      max-width: 1440px;
      width: 100%;
      margin: 0 auto;
    }

    .sidebar-backdrop {
      display: none;
    }

    @media (max-width: 1024px) {
      .hamburger-btn {
        display: block;
      }
      .status-text {
        display: none;
      }
      .admin-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      }
      .admin-sidebar.mobile-open {
        transform: translateX(0);
      }
      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        backdrop-filter: blur(3px);
        z-index: 45;
      }
      .admin-content-body {
        padding: 1.25rem 1rem;
      }
    }
  `],
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  sidebarOpen = signal(false);

  onNavClick(): void {
    if (window.innerWidth <= 1024) {
      this.sidebarOpen.set(false);
    }
  }
}

