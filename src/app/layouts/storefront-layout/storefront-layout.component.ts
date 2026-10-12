import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Announcement Bar -->
    <div class="announcement-bar">
      <div class="container flex-between py-1 text-xs">
        <span>✨ COMPLIMENTARY WORLDWIDE DELIVERY ON ORDERS OVER ₹1,500 &bull; CODE: <strong>LUXE10</strong></span>
        <div class="announcement-links">
          <span>24/7 Concierge Support</span>
        </div>
      </div>
    </div>

    <!-- Main Navigation Header -->
    <header class="navbar-header">
      <div class="container navbar-container">
        <!-- Logo -->
        <a routerLink="/" class="brand-logo">
          <span class="logo-accent">LUXE</span>
          <span class="logo-sub">STUDIO</span>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="desktop-nav">
          <a routerLink="/products" routerLinkActive="active-nav">All Creations</a>
          <a routerLink="/products" [queryParams]="{ category: 'audio-acoustics' }" routerLinkActive="active-nav">Acoustics</a>
          <a routerLink="/products" [queryParams]="{ category: 'smart-wearables' }" routerLinkActive="active-nav">Wearables</a>
          <a routerLink="/products" [queryParams]="{ category: 'workstation-design' }" routerLinkActive="active-nav">Workstations</a>
          <a routerLink="/products" [queryParams]="{ category: 'optics-photography' }" routerLinkActive="active-nav">Optics</a>
        </nav>

        <!-- Right Quick Actions -->
        <div class="header-actions">
          <!-- Quick Search -->
          <form (submit)="onSearch($event)" class="search-form">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              name="search"
              placeholder="Search catalog..."
              class="search-input"
            />
            <button type="submit" class="search-btn" aria-label="Search">🔍</button>
          </form>

          <!-- Wishlist -->
          <a routerLink="/wishlist" class="action-icon-btn" title="Wishlist">
            <span class="icon">♡</span>
            <span class="action-badge" *ngIf="wishlistService.count() > 0">{{ wishlistService.count() }}</span>
          </a>

          <!-- Cart -->
          <a routerLink="/cart" class="action-icon-btn" title="Shopping Bag">
            <span class="icon">🛍️</span>
            <span class="action-badge" *ngIf="cartService.itemCount() > 0">{{ cartService.itemCount() }}</span>
          </a>

          <!-- User Menu -->
          <ng-container *ngIf="authService.currentUser(); else guestMenu">
            <div class="user-dropdown">
              <a routerLink="/account" class="user-pill">
                <span class="user-avatar">{{ authService.currentUser()?.first_name?.charAt(0) }}</span>
                <span class="user-name">{{ authService.currentUser()?.first_name }}</span>
              </a>
              <button (click)="authService.logout()" class="logout-btn" title="Logout">⏻</button>
            </div>
          </ng-container>

          <ng-template #guestMenu>
            <a routerLink="/auth/login" class="btn btn-secondary btn-sm">Sign In</a>
          </ng-template>
        </div>
      </div>
    </header>

    <!-- Content Outlet -->
    <main class="page-content">
      <router-outlet></router-outlet>
    </main>

    <!-- Luxury Footer -->
    <footer class="store-footer">
      <div class="container footer-grid">
        <div class="footer-col-brand">
          <div class="brand-logo mb-3">
            <span class="logo-accent">LUXE</span>
            <span class="logo-sub">STUDIO</span>
          </div>
          <p class="text-sm text-muted mb-4">
            A curated house of modern luxury audio, titanium wearables, bespoke workstation hardware, and artisan travel essentials.
          </p>
          <div class="security-badges text-xs">
            <span>🔒 256-bit Encrypted Checkout</span>
            <span>✦ Verified Authentic</span>
          </div>
        </div>

        <div class="footer-col">
          <h4 class="footer-title">Collections</h4>
          <ul class="footer-links">
            <li><a routerLink="/products" [queryParams]="{ category: 'audio-acoustics' }">Audio & Acoustics</a></li>
            <li><a routerLink="/products" [queryParams]="{ category: 'smart-wearables' }">Smart Wearables</a></li>
            <li><a routerLink="/products" [queryParams]="{ category: 'workstation-design' }">Workstation & Design</a></li>
            <li><a routerLink="/products" [queryParams]="{ category: 'optics-photography' }">Optics & Cinema</a></li>
            <li><a routerLink="/products" [queryParams]="{ category: 'lifestyle-travel' }">Lifestyle & Travel</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-title">Concierge & Account</h4>
          <ul class="footer-links">
            <li><a routerLink="/account">My Account & Orders</a></li>
            <li><a routerLink="/wishlist">Saved Wishlist</a></li>
            <li><a routerLink="/cart">Shopping Bag</a></li>
          </ul>
        </div>

        <div class="footer-col newsletter-col">
          <h4 class="footer-title">Private Releases</h4>
          <p class="text-sm text-muted mb-3">
            Receive discreet invitations to limited product drops and private seasonal previews.
          </p>
          <div class="newsletter-form">
            <input type="email" placeholder="Enter private email..." class="newsletter-input" />
            <button class="btn btn-brand btn-sm">Subscribe</button>
          </div>
        </div>
      </div>

      <div class="container footer-bottom text-xs flex-between">
        <span>&copy; {{ currentYear }} LUXE Studio Inc. All rights reserved.</span>
        <div class="footer-terms">
          <span>Privacy Architecture</span>
          <span>Terms of Service</span>
          <span>Global Delivery</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .announcement-bar {
      background: #0f172a;
      color: #94a3b8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-weight: 500;
    }
    .announcement-links {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .admin-badge {
      background: #d97706;
      color: #ffffff;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
    }
    .navbar-header {
      position: sticky;
      top: 0;
      z-index: 900;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-surface-border);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    }
    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 4.5rem;
      gap: 2rem;
    }
    .brand-logo {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .logo-accent {
      font-size: 1.5rem;
      color: var(--color-primary);
      letter-spacing: 0.05em;
    }
    .logo-sub {
      font-size: 0.75rem;
      color: var(--color-brand);
      letter-spacing: 0.2em;
      font-weight: 700;
    }
    .desktop-nav {
      display: flex;
      align-items: center;
      gap: 1.75rem;
      font-size: 0.925rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }
    .desktop-nav a:hover, .active-nav {
      color: var(--color-primary);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .search-form {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-input {
      padding: 0.5rem 2.2rem 0.5rem 0.9rem;
      border: 1px solid var(--color-surface-border);
      border-radius: var(--radius-full);
      background: var(--color-surface-subtle);
      font-size: 0.85rem;
      width: 180px;
      transition: width var(--transition-smooth);
    }
    .search-input:focus {
      width: 240px;
      outline: none;
      background: #ffffff;
      border-color: var(--color-primary);
    }
    .search-btn {
      position: absolute;
      right: 0.75rem;
      font-size: 0.85rem;
    }
    .action-icon-btn {
      position: relative;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      background: var(--color-surface-subtle);
      font-size: 1.15rem;
      transition: background var(--transition-fast);
    }
    .action-icon-btn:hover {
      background: #e2e8f0;
    }
    .action-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: var(--color-brand);
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 700;
      min-width: 1.1rem;
      height: 1.1rem;
      padding: 0 0.25rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem 0.35rem 0.35rem;
      background: var(--color-surface-subtle);
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .user-avatar {
      width: 1.8rem;
      height: 1.8rem;
      background: var(--color-primary);
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }
    .logout-btn {
      color: var(--color-text-muted);
      font-size: 1.1rem;
      padding: 0.3rem;
    }
    .logout-btn:hover {
      color: var(--color-danger);
    }
    .page-content {
      min-height: calc(100vh - 4.5rem - 24rem);
    }
    .store-footer {
      background: #090d16;
      color: #94a3b8;
      padding-top: 4rem;
      padding-bottom: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 2fr;
      gap: 3rem;
      padding-bottom: 3rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .footer-title {
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      letter-spacing: 0.02em;
    }
    .footer-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-size: 0.885rem;
    }
    .footer-links a:hover {
      color: #ffffff;
    }
    .newsletter-form {
      display: flex;
      gap: 0.5rem;
    }
    .newsletter-input {
      flex: 1;
      padding: 0.6rem 0.9rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-md);
      color: #ffffff;
      font-size: 0.85rem;
    }
    .newsletter-input:focus {
      outline: none;
      border-color: var(--color-brand);
    }
    .footer-bottom {
      padding-top: 2rem;
    }
    .footer-terms {
      display: flex;
      gap: 1.5rem;
    }
    .flex-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .text-sm { font-size: 0.875rem; }
    .text-xs { font-size: 0.75rem; }
    .text-muted { color: #94a3b8; }
    .py-1 { padding-top: 0.35rem; padding-bottom: 0.35rem; }
    @media (max-width: 900px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .desktop-nav { display: none; }
    }
  `],
})
export class StorefrontLayoutComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  router = inject(Router);

  searchQuery = '';
  currentYear = new Date().getFullYear();

  onSearch(e: Event): void {
    e.preventDefault();
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }
}
