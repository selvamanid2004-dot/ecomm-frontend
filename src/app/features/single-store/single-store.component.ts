import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';

export interface StoreProduct {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  description: string;
  short_description?: string;
  base_price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  images?: Array<{ image_url: string }>;
  category?: { name: string };
  selectedQty: number;
}

export interface CartItem {
  product: StoreProduct;
  quantity: number;
  lineTotal: number;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  invoice_number?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_method: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  tracking_number?: string;
  created_at: string | Date;
  shipping_address_json?: any;
  items?: Array<{
    id: string;
    product_name: string;
    sku: string;
    unit_price: number;
    quantity: number;
    line_total: number;
    product_image_url?: string;
  }>;
}

@Component({
  selector: 'app-single-store',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="store-wrapper">
      <!-- Luxury Announcement Bar -->
      <header class="top-announcement">
        <div class="container flex-between py-1 text-xs">
          <span>{{ siteContent().announcement_text }}</span>
          <span class="text-gold font-bold">{{ siteContent().announcement_badge }}</span>
        </div>
      </header>

      <!-- Main Header -->
      <nav class="main-header">
        <div class="container flex-between h-20">
          <div class="brand-group">
            <span class="brand-title">{{ siteContent().brand_name }}</span>
            <span class="brand-tag">{{ siteContent().brand_tag }}</span>
          </div>

          <div class="header-actions">
            <!-- Customer Session (Logged In) -->
            <ng-container *ngIf="authService.currentCustomer(); else guestAuthBlock">
              <div class="customer-session-group flex items-center gap-2">
                <!-- My Orders Button -->
                <button (click)="openOrdersModal()" class="orders-nav-btn" title="View my order details">
                  <span class="orders-icon">📦</span>
                  <span class="orders-label">My Orders</span>
                  <span class="orders-badge" *ngIf="customerOrders().length > 0">{{ customerOrders().length }}</span>
                </button>

                <!-- Customer User Pill -->
                <div class="user-pill">
                  <span class="user-avatar">{{ authService.currentCustomer()?.first_name?.charAt(0) || 'U' }}</span>
                  <span class="user-name">{{ authService.currentCustomer()?.first_name }}</span>
                </div>

                <!-- Sign Out Button -->
                <button (click)="logoutCustomer()" class="logout-icon-btn" title="Sign Out">
                  ⏻
                </button>
              </div>
            </ng-container>

            <!-- Guest Session (Not Logged In) -->
            <ng-template #guestAuthBlock>
              <div class="guest-actions flex items-center gap-2">
                <button (click)="openAuthModal('login')" class="btn btn-ghost btn-sm">
                  Sign In
                </button>
                <button (click)="openAuthModal('register')" class="btn btn-outline btn-sm">
                  Sign Up
                </button>
              </div>
            </ng-template>

            <!-- Customer Cart Button -->
            <button (click)="toggleCart()" class="cart-btn" [class.has-items]="cartTotalCount() > 0">
              <span class="cart-icon">🛍️</span>
              <span class="cart-label">Bag</span>
              <span class="cart-badge" *ngIf="cartTotalCount() > 0">{{ cartTotalCount() }}</span>
              <span class="cart-price" *ngIf="cartTotalCount() > 0">&bull; ₹{{ cartSubtotal() | number: '1.2-2' }}</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Hero Banner -->
      <section class="hero-section">
        <div class="container hero-content text-center">
          <span class="hero-badge">{{ siteContent().hero_badge }}</span>
          <h1 class="hero-heading">{{ siteContent().hero_heading }}</h1>
          <p class="hero-subheading">
            {{ siteContent().hero_subheading }}
          </p>
        </div>
      </section>

      <!-- Products Section (Starts with 3 products) -->
      <main class="container py-8">
        <div class="section-header flex-between mb-6">
          <div>
            <h2 class="section-title">{{ siteContent().products_section_title }}</h2>
            <p class="text-muted text-sm">{{ siteContent().products_section_subtitle }}</p>
          </div>
          <div class="product-count-pill">
            <span>{{ products().length }} Products</span>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="loading-state text-center py-12">
          <div class="spinner"></div>
          <p class="text-muted mt-3">Curating collection...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && products().length === 0" class="empty-products-state text-center py-12">
          <span class="text-4xl block mb-2">🛍️</span>
          <h3 class="text-lg font-bold text-white">No Creations Currently Available</h3>
          <p class="text-muted text-xs mt-1">Please refresh to check available bespoke releases.</p>
          <button (click)="fetchProducts()" class="btn btn-brand btn-sm mt-3">Reload Collection</button>
        </div>

        <!-- Products Grid -->
        <div *ngIf="!loading() && products().length > 0" class="products-grid">
          <div *ngFor="let p of products()" class="product-card">
            <!-- Image Showcase -->
            <div class="image-wrapper">
              <img
                [src]="getProductImage(p)"
                [alt]="p.name"
                class="product-image"
                loading="lazy"
                decoding="async"
              />
              <span *ngIf="p.stock_quantity <= 0" class="stock-pill low-stock">
                Sold Out
              </span>
            </div>

            <!-- Product Body -->
            <div class="product-details">
              <div class="category-tag">{{ p.category?.name || 'Exclusive Item' }}</div>
              <h3 class="product-name">{{ p.name }}</h3>
              <p class="product-desc">{{ p.short_description || p.description }}</p>

              <!-- Price Row -->
              <div class="price-row">
                <span class="current-price">₹{{ p.base_price | number: '1.2-2' }}</span>
                <span *ngIf="p.compare_at_price" class="compare-price">
                  ₹{{ p.compare_at_price | number: '1.2-2' }}
                </span>
              </div>

              <!-- Quantity Selector & Actions -->
              <div class="action-box">
                <div class="qty-selector">
                  <span class="qty-label">Quantity:</span>
                  <div class="qty-stepper">
                    <button
                      type="button"
                      (click)="decrementQty(p)"
                      [disabled]="p.selectedQty <= 0"
                      class="qty-btn"
                      title="Decrease quantity"
                    >
                      &minus;
                    </button>
                    <span class="qty-number">{{ p.selectedQty }}</span>
                    <button
                      type="button"
                      (click)="incrementQty(p)"
                      [disabled]="p.selectedQty >= p.stock_quantity"
                      class="qty-btn"
                      title="Increase quantity"
                    >
                      &#43;
                    </button>
                  </div>
                </div>

                <div class="buttons-row">
                  <button
                    type="button"
                    (click)="addToCart(p)"
                    [disabled]="p.stock_quantity <= 0"
                    class="btn btn-primary add-bag-btn"
                  >
                    <span *ngIf="p.selectedQty > 0">Add {{ p.selectedQty }} to Bag &bull; ₹{{ (p.base_price * p.selectedQty) | number: '1.2-2' }}</span>
                    <span *ngIf="p.selectedQty === 0">Add to Bag &bull; ₹{{ p.base_price | number: '1.2-2' }}</span>
                  </button>
                  <button
                    type="button"
                    (click)="buyNow(p)"
                    [disabled]="p.stock_quantity <= 0"
                    class="btn btn-brand buy-now-btn"
                  >
                    Buy Now &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Cart Drawer Overlay & Panel -->
      <div class="cart-backdrop" *ngIf="isCartOpen()" (click)="closeCart()"></div>
      <aside class="cart-drawer" [class.open]="isCartOpen()">
        <div class="cart-drawer-header flex-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">🛍️</span>
            <h3 class="cart-drawer-title">Shopping Bag</h3>
            <span class="item-count-badge" *ngIf="cartItems().length > 0">{{ cartTotalCount() }}</span>
          </div>
          <button (click)="closeCart()" class="close-drawer-btn" title="Close Bag">&times;</button>
        </div>

        <div class="cart-drawer-body">
          <div *ngIf="cartItems().length === 0" class="empty-cart-state text-center py-10">
            <span class="empty-cart-icon">🛒</span>
            <h4>Your bag is empty</h4>
            <p class="text-muted text-sm mt-1">Select a creation to get started.</p>
            <button (click)="closeCart()" class="btn btn-outline btn-sm mt-4">Discover Products</button>
          </div>

          <div *ngIf="cartItems().length > 0" class="cart-items-list">
            <div *ngFor="let item of cartItems()" class="cart-item-row">
              <img [src]="getProductImage(item.product)" [alt]="item.product.name" class="cart-thumb" />
              <div class="cart-item-info">
                <h4 class="cart-item-title">{{ item.product.name }}</h4>
                <div class="cart-item-unit">₹{{ item.product.base_price | number: '1.2-2' }} each</div>
                
                <div class="cart-item-stepper-row flex-between mt-2">
                  <div class="qty-stepper sm">
                    <button (click)="updateCartQty(item, -1)" class="qty-btn sm">&minus;</button>
                    <span class="qty-number sm">{{ item.quantity }}</span>
                    <button (click)="updateCartQty(item, 1)" class="qty-btn sm">&#43;</button>
                  </div>
                  <span class="cart-item-total font-bold">₹{{ item.lineTotal | number: '1.2-2' }}</span>
                </div>
              </div>
              <button (click)="removeCartItem(item)" class="remove-item-btn" title="Remove item">&times;</button>
            </div>
          </div>
        </div>

        <div class="cart-drawer-footer" *ngIf="cartItems().length > 0">
          <div class="summary-line flex-between text-sm mb-1">
            <span class="text-muted">Subtotal</span>
            <span>₹{{ cartSubtotal() | number: '1.2-2' }}</span>
          </div>
          <div class="summary-line flex-between text-sm mb-1">
            <span class="text-muted">Express Delivery</span>
            <span class="text-success font-bold">COMPLIMENTARY</span>
          </div>
          <div class="summary-line flex-between text-base font-extrabold py-2 border-t mt-2">
            <span>Total Amount</span>
            <span class="text-gold">₹{{ cartSubtotal() | number: '1.2-2' }}</span>
          </div>

          <!-- Checkout Button: Gated by Authentication -->
          <button (click)="openCheckout()" class="btn btn-primary w-full btn-lg mt-3 checkout-cta">
            Proceed to Checkout &rarr;
          </button>
        </div>
      </aside>

      <!-- Simple Customer Authentication Modal (Login & Sign Up Only) -->
      <div class="modal-backdrop" *ngIf="isAuthModalOpen()" (click)="closeAuthModal()">
        <div class="modal-card auth-modal" (click)="$event.stopPropagation()">
          <div class="modal-header flex-between">
            <h2 class="modal-title">{{ authTab() === 'login' ? 'Sign In' : 'Sign Up' }}</h2>
            <button (click)="closeAuthModal()" class="close-modal-btn">&times;</button>
          </div>

          <!-- Notice when redirected from Checkout -->
          <div *ngIf="authPromptNotice()" class="checkout-gate-banner p-3 text-xs text-center border-b">
            {{ authPromptNotice() }}
          </div>

          <div class="auth-modal-body p-6">
            <!-- 1. SIMPLE LOGIN FORM (Only Email ID & Password) -->
            <div *ngIf="authTab() === 'login'">
              <form (submit)="submitLogin($event)">
                <div class="form-group mb-3">
                  <label class="form-label">Email ID</label>
                  <input
                    type="email"
                    [(ngModel)]="loginEmail"
                    name="email"
                    required
                    class="form-control"
                    placeholder="name@example.com"
                  />
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">Password</label>
                  <input
                    type="password"
                    [(ngModel)]="loginPassword"
                    name="password"
                    required
                    class="form-control"
                    placeholder="••••••••"
                  />
                </div>

                <div *ngIf="authError()" class="alert-box text-danger text-xs mb-3">
                  {{ authError() }}
                </div>

                <button
                  type="submit"
                  [disabled]="isAuthSubmitting() || !loginEmail || !loginPassword"
                  class="btn btn-primary w-full btn-lg mb-3"
                >
                  {{ isAuthSubmitting() ? 'Signing In...' : 'Sign In' }}
                </button>

                <p class="text-center text-xs text-muted mt-2">
                  Don't have an account?
                  <button type="button" (click)="switchAuthTab('register')" class="text-gold font-bold underline bg-transparent border-none cursor-pointer">
                    Sign Up
                  </button>
                </p>
              </form>
            </div>

            <!-- 2. SIMPLE SIGN UP FORM (Full Name, Email ID, Password) -->
            <div *ngIf="authTab() === 'register'">
              <form (submit)="submitRegister($event)">
                <div class="form-group mb-3">
                  <label class="form-label">Full Name</label>
                  <input
                    type="text"
                    [(ngModel)]="registerFullName"
                    name="name"
                    required
                    class="form-control"
                    placeholder="e.g. Sophia Chen"
                  />
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Email ID</label>
                  <input
                    type="email"
                    [(ngModel)]="registerEmail"
                    name="email"
                    required
                    class="form-control"
                    placeholder="name@example.com"
                  />
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">Password</label>
                  <input
                    type="password"
                    [(ngModel)]="registerPassword"
                    name="password"
                    required
                    class="form-control"
                    placeholder="••••••••"
                  />
                </div>

                <div *ngIf="authError()" class="alert-box text-danger text-xs mb-3">
                  {{ authError() }}
                </div>

                <button
                  type="submit"
                  [disabled]="isAuthSubmitting() || !registerEmail || !registerPassword"
                  class="btn btn-primary w-full btn-lg mb-3"
                >
                  {{ isAuthSubmitting() ? 'Creating Account...' : 'Sign Up' }}
                </button>

                <p class="text-center text-xs text-muted mt-2">
                  Already have an account?
                  <button type="button" (click)="switchAuthTab('login')" class="text-gold font-bold underline bg-transparent border-none cursor-pointer">
                    Sign In
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Checkout Modal (Accessed only when logged in) -->
      <div class="modal-backdrop" *ngIf="isCheckoutOpen()" (click)="closeCheckout()">
        <div class="modal-card checkout-modal" (click)="$event.stopPropagation()">
          <div class="modal-header flex-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">💳</span>
              <h2 class="modal-title">Express Secure Checkout</h2>
            </div>
            <button (click)="closeCheckout()" class="close-modal-btn">&times;</button>
          </div>

          <form (submit)="placeOrder($event)" class="checkout-form">
            <div class="checkout-grid">
              <!-- Customer Details -->
              <div class="checkout-col">
                <h3 class="form-section-title">1. Contact & Shipping</h3>

                <div class="form-group mb-3">
                  <label class="form-label">Full Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="checkoutForm.recipientName"
                    name="name"
                    required
                    class="form-control"
                    placeholder="e.g. Sophia Chen"
                  />
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Email ID *</label>
                  <input
                    type="email"
                    [(ngModel)]="checkoutForm.email"
                    name="email"
                    required
                    class="form-control"
                    placeholder="sophia.chen@example.com"
                  />
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Phone Number</label>
                  <input
                    type="tel"
                    [(ngModel)]="checkoutForm.phone"
                    name="phone"
                    class="form-control"
                    placeholder="+1 (555) 014-2938"
                  />
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Street Address *</label>
                  <input
                    type="text"
                    [(ngModel)]="checkoutForm.streetAddress"
                    name="street"
                    required
                    class="form-control"
                    placeholder="742 Evergreen Terrace, Suite 500"
                  />
                </div>

                <div class="form-row flex gap-2">
                  <div class="form-group flex-1">
                    <label class="form-label">City *</label>
                    <input
                      type="text"
                      [(ngModel)]="checkoutForm.city"
                      name="city"
                      required
                      class="form-control"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label">State</label>
                    <input
                      type="text"
                      [(ngModel)]="checkoutForm.state"
                      name="state"
                      class="form-control"
                      placeholder="CA"
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label">ZIP / Postal *</label>
                    <input
                      type="text"
                      [(ngModel)]="checkoutForm.postalCode"
                      name="zip"
                      required
                      class="form-control"
                      placeholder="94107"
                    />
                  </div>
                </div>
              </div>

              <!-- Payment & Order Summary -->
              <div class="checkout-col checkout-summary-col">
                <h3 class="form-section-title">2. Payment & Confirmation</h3>

                <div class="payment-method-selector mb-3">
                  <label class="payment-option" [class.selected]="checkoutForm.paymentMethod === 'card'">
                    <input
                      type="radio"
                      [(ngModel)]="checkoutForm.paymentMethod"
                      name="paymentMethod"
                      value="card"
                    />
                    <span>💳 Credit / Debit Card (Instant Mock)</span>
                  </label>
                  <label class="payment-option" [class.selected]="checkoutForm.paymentMethod === 'cod'">
                    <input
                      type="radio"
                      [(ngModel)]="checkoutForm.paymentMethod"
                      name="paymentMethod"
                      value="cod"
                    />
                    <span>📦 Cash on Delivery / Concierge</span>
                  </label>
                </div>

                <!-- Order Items Mini Preview -->
                <div class="order-items-mini mb-3">
                  <h4 class="mini-title text-xs font-bold text-muted mb-2">ORDER ITEMS:</h4>
                  <div *ngFor="let item of cartItems()" class="mini-item flex-between text-xs py-1">
                    <span class="truncate max-w-xs">{{ item.quantity }}x {{ item.product.name }}</span>
                    <span class="font-bold">₹{{ item.lineTotal | number: '1.2-2' }}</span>
                  </div>
                </div>

                <!-- Totals -->
                <div class="checkout-totals p-3 rounded-md bg-subtle mb-4">
                  <div class="flex-between text-xs mb-1">
                    <span>Subtotal</span>
                    <span>₹{{ cartSubtotal() | number: '1.2-2' }}</span>
                  </div>
                  <div class="flex-between text-xs mb-1">
                    <span>Express Worldwide Shipping</span>
                    <span class="text-success font-bold">FREE</span>
                  </div>
                  <div class="flex-between text-sm font-bold border-t pt-2 mt-2">
                    <span>Total Amount Due</span>
                    <span class="text-gold font-extrabold text-base">₹{{ cartSubtotal() | number: '1.2-2' }}</span>
                  </div>
                </div>

                <div *ngIf="checkoutError()" class="alert-box text-danger text-xs mb-3">
                  {{ checkoutError() }}
                </div>

                <button
                  type="submit"
                  [disabled]="isSubmittingOrder()"
                  class="btn btn-primary w-full btn-lg complete-order-btn"
                >
                  {{ isSubmittingOrder() ? 'Processing Order...' : ('Complete Purchase • ₹' + (cartSubtotal() | number: '1.2-2')) }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Order Success Modal -->
      <div class="modal-backdrop" *ngIf="confirmedOrder()" (click)="closeConfirmation()">
        <div class="modal-card success-modal text-center p-6" (click)="$event.stopPropagation()">
          <div class="success-icon-badge">✓</div>
          <span class="text-xs uppercase font-extrabold text-gold tracking-widest block mb-1">ORDER CONFIRMED</span>
          <h2 class="text-2xl font-black mb-2">Thank You For Your Order</h2>
          <p class="text-sm text-muted mb-4">
            Your bespoke package is currently being prepared by our fulfillment concierge.
          </p>

          <div class="confirmation-box p-4 rounded-md text-left text-xs mb-4">
            <div class="flex-between py-1 border-b">
              <span class="text-muted">Order Identifier</span>
              <strong class="font-mono text-gold">{{ confirmedOrder()?.orderNumber }}</strong>
            </div>
            <div class="flex-between py-1 border-b">
              <span class="text-muted">Recipient</span>
              <strong>{{ confirmedOrder()?.recipientName }}</strong>
            </div>
            <div class="flex-between py-1 border-b">
              <span class="text-muted">Email ID</span>
              <strong>{{ confirmedOrder()?.email }}</strong>
            </div>
            <div class="flex-between py-1">
              <span class="text-muted">Amount Paid</span>
              <strong class="text-gold text-sm">₹{{ confirmedOrder()?.totalAmount | number: '1.2-2' }}</strong>
            </div>
          </div>

          <!-- Prominent Automatic Bill / Invoice PDF Download -->
          <div class="mb-3">
            <button
              (click)="downloadConfirmationBill()"
              [disabled]="downloadingBill()"
              class="btn btn-gold w-full flex items-center justify-center gap-2 py-3"
              style="background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff; font-weight: 800; font-size: 0.95rem; border-radius: 0.5rem; border: none; cursor: pointer;"
            >
              <span style="font-size: 1.15rem;">📄</span>
              <span>{{ downloadingBill() ? 'Generating PDF Invoice...' : 'Download Bill (PDF)' }}</span>
            </button>
          </div>

          <div class="flex gap-2">
            <button (click)="openOrdersModal()" class="btn btn-brand flex-1">
              View My Orders &rarr;
            </button>
            <button (click)="closeConfirmation()" class="btn btn-outline flex-1">
              Return to Boutique
            </button>
          </div>
        </div>
      </div>

      <!-- Customer Order Details & History Modal (Strictly Isolated Per Customer) -->
      <div class="modal-backdrop" *ngIf="isOrdersModalOpen()" (click)="closeOrdersModal()">
        <div class="modal-card orders-modal" (click)="$event.stopPropagation()">
          <div class="modal-header flex-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">📦</span>
              <div>
                <h2 class="modal-title">My Orders</h2>
                <span class="text-xs text-muted">Order history for {{ authService.currentCustomer()?.email }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="fetchCustomerOrders()" class="refresh-orders-btn" [disabled]="loadingOrders()" title="Refresh latest order status">
                ⟳ Refresh Status
              </button>
              <button (click)="closeOrdersModal()" class="close-modal-btn">&times;</button>
            </div>
          </div>

          <div class="orders-modal-body p-6">
            <!-- Loading Orders -->
            <div *ngIf="loadingOrders()" class="text-center py-8">
              <div class="spinner"></div>
              <p class="text-muted text-xs mt-2">Loading your orders...</p>
            </div>

            <!-- Empty Orders State -->
            <div *ngIf="!loadingOrders() && customerOrders().length === 0" class="text-center py-10">
              <span class="empty-cart-icon">📦</span>
              <h3 class="text-lg font-bold text-white mb-1">No Orders Found</h3>
              <p class="text-muted text-xs max-w-sm mx-auto mb-4">
                You have not placed any orders under this account yet.
              </p>
              <button (click)="closeOrdersModal()" class="btn btn-primary btn-sm">
                Discover Creations
              </button>
            </div>

            <!-- Orders List -->
            <div *ngIf="!loadingOrders() && customerOrders().length > 0" class="orders-list-wrapper flex flex-col gap-4">
              <div *ngFor="let order of customerOrders()" class="order-detail-card p-4 rounded-md">
                <!-- Card Header -->
                <div class="order-card-header flex-between pb-3 border-b mb-3">
                  <div>
                    <span class="order-num font-mono font-black text-gold text-sm">{{ order.order_number }}</span>
                    <span class="order-date text-xs text-muted block">{{ order.created_at | date:'mediumDate' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="status-badge"
                      [class.delivered]="order.status === 'delivered'"
                      [class.shipped]="order.status === 'shipped'"
                      [class.processing]="order.status === 'processing'"
                      [class.pending]="order.status === 'pending'"
                      [class.cancelled]="order.status === 'cancelled'"
                    >
                      {{ order.status | uppercase }}
                    </span>
                    <span class="payment-badge text-xs font-bold text-success">PAID</span>
                  </div>
                </div>

                <!-- Tracking Information Bar -->
                <div class="tracking-bar flex-between p-2 rounded bg-subtle text-xs mb-3">
                  <div class="flex items-center gap-2">
                    <span>🚚 Courier: <strong>{{ order.shipping_method || 'FedEx Express Air' }}</strong></span>
                  </div>
                  <div class="tracking-num font-mono text-gold">
                    Tracking: {{ order.tracking_number || 'TRK-FX-992384711' }}
                  </div>
                </div>

                <!-- Items Breakdown -->
                <div class="order-items-breakdown mb-3">
                  <h4 class="text-xs font-bold text-muted mb-2">PURCHASED ITEMS:</h4>
                  <div *ngFor="let item of order.items" class="order-item-line flex-between py-1 text-xs">
                    <div class="flex items-center gap-2">
                      <img
                        *ngIf="item.product_image_url"
                        [src]="item.product_image_url"
                        [alt]="item.product_name"
                        class="order-item-thumb"
                      />
                      <span>{{ item.quantity }}x <strong>{{ item.product_name }}</strong></span>
                    </div>
                    <span class="font-bold">₹{{ (item.line_total || (item.unit_price * item.quantity)) | number: '1.2-2' }}</span>
                  </div>
                </div>

                <!-- Card Footer (Totals & Shipping Destination) -->
                <div class="order-card-footer flex-between pt-3 border-t text-xs">
                  <div class="delivery-dest text-muted">
                    <span class="block">📍 Delivery Address:</span>
                    <strong class="text-white">
                      {{ order.shipping_address_json?.recipient_name || authService.currentCustomer()?.first_name }},
                      {{ order.shipping_address_json?.city || 'San Francisco' }},
                      {{ order.shipping_address_json?.state || 'CA' }}
                    </strong>
                  </div>
                  <div class="order-total-dest text-right">
                    <span class="text-muted block">Total Paid:</span>
                    <strong class="text-gold text-sm font-black">₹{{ order.total_amount | number: '1.2-2' }}</strong>
                  </div>
                </div>

                <!-- Official Invoice & Bill Download Action -->
                <div class="flex-between pt-3 mt-3 border-t text-xs" style="border-color: rgba(255,255,255,0.08);">
                  <span class="text-muted">
                    Tax Invoice: <strong class="font-mono text-gold">{{ order.invoice_number || ('INV-' + (order.order_number?.replace('ORD-', '') || order.id)) }}</strong>
                  </span>
                  <button
                    (click)="downloadOrderBill(order)"
                    [disabled]="downloadingOrderId() === order.id"
                    class="btn btn-outline btn-xs font-bold flex items-center gap-1.5"
                    style="border-color: rgba(217,119,6,0.5); color: #f59e0b;"
                  >
                    <span>📄</span>
                    <span>{{ downloadingOrderId() === order.id ? 'Generating...' : 'Download Bill (PDF)' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <div class="toast-notification" *ngIf="toastMessage()">
        {{ toastMessage() }}
      </div>

      <!-- Clean Minimal Footer (No Admin Links) -->
      <footer class="single-footer">
        <div class="container flex-between py-6 text-xs text-muted">
          <div>
            <span class="font-bold text-white">{{ siteContent().footer_text }}</span>
          </div>
          <div>
            <span>&copy; {{ currentYear }} All rights reserved. 256-bit Encrypted Checkout.</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #090d16;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .store-wrapper {
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .container {
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
    .flex-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-end { justify-content: flex-end; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .py-1 { padding-top: 0.35rem; padding-bottom: 0.35rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .py-8 { padding-top: 2.5rem; padding-bottom: 3.5rem; flex: 1; }
    .py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
    .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
    .pb-3 { padding-bottom: 0.75rem; }
    .pt-2 { padding-top: 0.5rem; }
    .pt-3 { padding-top: 0.75rem; }
    .p-2 { padding: 0.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-base { font-size: 1rem; }
    .text-lg { font-size: 1.15rem; }
    .text-xl { font-size: 1.25rem; }
    .text-2xl { font-size: 1.5rem; }
    .font-bold { font-weight: 700; }
    .font-extrabold { font-weight: 800; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: monospace; }
    .text-gold { color: #f59e0b; }
    .text-success { color: #10b981; }
    .text-danger { color: #ef4444; }
    .text-muted { color: #94a3b8; }
    .text-white { color: #ffffff; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .w-full { width: 100%; }
    .h-20 { height: 5rem; }
    .border-t { border-top: 1px solid rgba(255, 255, 255, 0.1); }
    .border-b { border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .rounded-md { border-radius: 0.5rem; }
    .rounded { border-radius: 0.35rem; }
    .block { display: block; }
    .underline { text-decoration: underline; }
    .cursor-pointer { cursor: pointer; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .max-w-sm { max-width: 320px; }

    /* Top Announcement */
    .top-announcement {
      background: #020617;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
    }

    /* Header */
    .main-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(9, 13, 22, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-group {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }
    .brand-title {
      font-size: 1.6rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      color: #ffffff;
    }
    .brand-tag {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.25em;
      color: #f59e0b;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Customer Header Controls */
    .orders-nav-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 9999px;
      padding: 0.4rem 0.85rem;
      color: #f59e0b;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .orders-nav-btn:hover {
      background: #f59e0b;
      color: #000000;
    }
    .orders-badge {
      background: #f59e0b;
      color: #000000;
      font-size: 0.65rem;
      font-weight: 900;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
    }
    .orders-nav-btn:hover .orders-badge {
      background: #000000;
      color: #ffffff;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem 0.35rem 0.35rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .user-avatar {
      width: 1.6rem;
      height: 1.6rem;
      background: #ffffff;
      color: #090d16;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 900;
    }
    .logout-icon-btn {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 1.15rem;
      cursor: pointer;
      padding: 0.2rem;
      transition: color 0.2s;
    }
    .logout-icon-btn:hover {
      color: #ef4444;
    }

    .cart-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      padding: 0.45rem 1rem;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cart-btn:hover, .cart-btn.has-items {
      background: #ffffff;
      color: #090d16;
      border-color: #ffffff;
    }
    .cart-badge {
      background: #f59e0b;
      color: #000000;
      font-size: 0.7rem;
      font-weight: 900;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
    }

    /* Hero */
    .hero-section {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(9, 13, 22, 1) 100%);
      padding: 4rem 1rem 2rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .hero-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.2em;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1rem;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .hero-heading {
      font-size: 2.75rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1.15;
      color: #ffffff;
      margin-bottom: 1rem;
    }
    .hero-subheading {
      font-size: 1.05rem;
      color: #94a3b8;
      max-width: 650px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* Section Title */
    .section-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
    }
    .product-count-pill {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
    }
    .product-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
    }
    .product-card:hover {
      transform: translateY(-4px);
      border-color: rgba(245, 158, 11, 0.4);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    }
    .image-wrapper {
      position: relative;
      width: 100%;
      height: 280px;
      background: #020617;
      overflow: hidden;
    }
    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .product-card:hover .product-image {
      transform: scale(1.05);
    }
    .stock-pill {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(16, 185, 129, 0.9);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      backdrop-filter: blur(4px);
    }
    .stock-pill.low-stock {
      background: rgba(239, 68, 68, 0.9);
    }
    .product-details {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .category-tag {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #f59e0b;
      margin-bottom: 0.5rem;
    }
    .product-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.3;
      margin-bottom: 0.5rem;
    }
    .product-desc {
      font-size: 0.85rem;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 1.25rem;
      flex: 1;
    }
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .current-price {
      font-size: 1.5rem;
      font-weight: 900;
      color: #ffffff;
    }
    .compare-price {
      font-size: 0.95rem;
      color: #64748b;
      text-decoration: line-through;
    }

    /* Action Box & Stepper */
    .action-box {
      background: rgba(2, 6, 23, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 0.75rem;
      padding: 1rem;
    }
    .qty-selector {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .qty-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .qty-stepper {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .qty-btn {
      width: 2.2rem;
      height: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background 0.15s;
    }
    .qty-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
    }
    .qty-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .qty-number {
      padding: 0 0.85rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
    }
    .qty-stepper.sm {
      border-radius: 0.35rem;
    }
    .qty-btn.sm {
      width: 1.6rem;
      height: 1.6rem;
      font-size: 0.9rem;
    }
    .qty-number.sm {
      padding: 0 0.5rem;
      font-size: 0.8rem;
    }

    /* Buttons */
    .buttons-row {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      border-radius: 0.5rem;
      padding: 0.65rem 1.25rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-sm { padding: 0.4rem 0.85rem; font-size: 0.8rem; }
    .btn-lg { padding: 0.85rem 1.5rem; font-size: 0.95rem; }
    .btn-primary {
      background: #ffffff;
      color: #090d16;
    }
    .btn-primary:hover:not(:disabled) {
      background: #e2e8f0;
      transform: translateY(-1px);
    }
    .btn-brand {
      background: #f59e0b;
      color: #000000;
    }
    .btn-brand:hover:not(:disabled) {
      background: #d97706;
      color: #ffffff;
    }
    .btn-ghost {
      background: transparent;
      color: #cbd5e1;
    }
    .btn-ghost:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }
    .btn-outline {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    /* Cart Drawer */
    .cart-backdrop, .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 100;
    }
    .cart-drawer {
      position: fixed;
      top: 0;
      right: -480px;
      width: 100%;
      max-width: 440px;
      height: 100vh;
      background: #0f172a;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 101;
      display: flex;
      flex-direction: column;
      transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
    }
    .cart-drawer.open {
      right: 0;
    }
    .cart-drawer-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .cart-drawer-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
    }
    .item-count-badge {
      background: #f59e0b;
      color: #000000;
      font-size: 0.75rem;
      font-weight: 900;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }
    .close-drawer-btn, .close-modal-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.75rem;
      cursor: pointer;
      line-height: 1;
    }
    .close-drawer-btn:hover, .close-modal-btn:hover {
      color: #ffffff;
    }
    .cart-drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }
    .cart-item-row {
      display: flex;
      gap: 1rem;
      padding-bottom: 1.25rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }
    .cart-thumb {
      width: 70px;
      height: 70px;
      object-fit: cover;
      border-radius: 0.5rem;
      background: #020617;
    }
    .cart-item-info {
      flex: 1;
    }
    .cart-item-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
    }
    .cart-item-unit {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.2rem;
    }
    .remove-item-btn {
      position: absolute;
      top: 0;
      right: 0;
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 1.25rem;
      cursor: pointer;
    }
    .remove-item-btn:hover {
      color: #ef4444;
    }
    .cart-drawer-footer {
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: #0b1120;
    }
    .checkout-cta {
      font-weight: 900;
      letter-spacing: 0.02em;
    }

    /* Modal Styles */
    .modal-backdrop {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 1rem;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
    }
    .checkout-modal { max-width: 820px; }
    .auth-modal { max-width: 400px; }
    .orders-modal { max-width: 680px; }
    .success-modal { max-width: 460px; }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
    }

    /* Checkout Gate Banner */
    .checkout-gate-banner {
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      font-weight: 700;
      border-color: rgba(245, 158, 11, 0.2);
    }

    /* Orders Modal Card */
    .order-detail-card {
      background: rgba(2, 6, 23, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .status-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      background: #3b82f6;
      color: #ffffff;
    }
    .status-badge.delivered {
      background: #10b981;
      color: #ffffff;
    }
    .status-badge.pending {
      background: #f59e0b;
      color: #000000;
    }
    .status-badge.processing {
      background: #0284c7;
      color: #ffffff;
    }
    .status-badge.shipped {
      background: #8b5cf6;
      color: #ffffff;
    }
    .status-badge.cancelled {
      background: #ef4444;
      color: #ffffff;
    }
    .refresh-orders-btn {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.3rem 0.65rem;
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 0.35rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .refresh-orders-btn:hover {
      background: rgba(245, 158, 11, 0.25);
    }
    .order-item-thumb {
      width: 32px;
      height: 32px;
      object-fit: cover;
      border-radius: 0.25rem;
      background: #020617;
    }

    /* Checkout & General Form */
    .checkout-form { padding: 1.5rem; }
    .checkout-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 2rem;
    }
    .form-section-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .form-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 0.35rem;
    }
    .form-control {
      width: 100%;
      padding: 0.65rem 0.85rem;
      background: rgba(2, 6, 23, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      color: #ffffff;
      font-size: 0.85rem;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .form-control:focus {
      outline: none;
      border-color: #f59e0b;
    }
    .payment-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(2, 6, 23, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .payment-option.selected {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.08);
    }
    .bg-subtle { background: rgba(2, 6, 23, 0.8); }
    .success-icon-badge {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: #10b981;
      color: #ffffff;
      font-size: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem auto;
      font-weight: 900;
    }
    .confirmation-box {
      background: rgba(2, 6, 23, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .toast-notification {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #f59e0b;
      color: #000000;
      font-weight: 800;
      font-size: 0.85rem;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      z-index: 200;
      animation: fadeIn 0.3s ease;
    }
    .alert-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 0.5rem 0.75rem;
      border-radius: 0.35rem;
    }
    .single-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: #020617;
      margin-top: auto;
    }
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .max-w-xs { max-width: 220px; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 900px) {
      .products-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.25rem;
      }
      .checkout-grid {
        grid-template-columns: 1fr;
      }
      .hero-heading {
        font-size: 2.25rem;
      }
    }

    @media (max-width: 640px) {
      .main-header .container {
        padding-left: 0.85rem;
        padding-right: 0.85rem;
        height: auto;
        min-height: 4rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        gap: 0.5rem;
      }
      .top-announcement .container {
        flex-direction: column;
        gap: 0.25rem;
        text-align: center;
        padding: 0.35rem 0.75rem;
      }
      .brand-title {
        font-size: 1.25rem;
      }
      .brand-tag {
        font-size: 0.65rem;
      }
      .header-actions {
        gap: 0.35rem;
      }
      .orders-nav-btn {
        padding: 0.35rem 0.55rem;
      }
      .orders-label, .cart-label {
        display: none;
      }
      .cart-price {
        display: none;
      }
      .user-pill {
        padding: 0.25rem;
      }
      .user-name {
        display: none;
      }
      .hero-section {
        padding: 2.25rem 1rem;
      }
      .hero-heading {
        font-size: 1.65rem;
        line-height: 1.2;
      }
      .hero-subheading {
        font-size: 0.825rem;
        padding: 0 0.25rem;
      }
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .products-grid {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }
      .image-wrapper {
        height: 230px;
      }
      .product-details {
        padding: 1rem;
      }
      .product-name {
        font-size: 1.1rem;
      }
      .current-price {
        font-size: 1.25rem;
      }
      .cart-drawer {
        width: 100vw;
        max-width: 100vw;
        right: -100vw;
      }
      .modal-backdrop {
        padding: 1rem 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-card {
        border-radius: 1rem;
        max-height: 92vh;
        width: 100%;
        margin: auto;
      }
      .auth-modal {
        max-width: 420px;
        margin: auto;
      }
      .success-modal {
        max-width: 440px;
        margin: auto;
      }
      .checkout-form {
        padding: 1rem;
      }
      .toast-notification {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        text-align: center;
      }
    }
  `],
})
export class SingleStoreComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private exportService = inject(ExportService);
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;
  private orderUrl = `${environment.apiUrl}/orders`;
  private contentUrl = `${environment.apiUrl}/content/storefront`;

  // Dynamic Storefront Content (CMS)
  siteContent = signal({
    announcement_text: '✨ COMPLIMENTARY WORLDWIDE EXPRESS DELIVERY • BESPOKE COLLECTION',
    announcement_badge: 'LIMITED DIRECT RELEASE',
    brand_name: 'LUXE',
    brand_tag: 'STUDIO',
    hero_badge: 'THE EXCLUSIVE CURATION',
    hero_heading: 'Crafted for the Discerning',
    hero_subheading: 'Experience our meticulously engineered collection. Select your desired quantities, review your bag, and complete checkout seamlessly in one place.',
    products_section_title: 'Available Creations',
    products_section_subtitle: 'Select quantity and proceed directly to purchase.',
    footer_text: 'LUXE STUDIO BOUTIQUE • Direct Single Page Experience',
  });

  products = signal<StoreProduct[]>([]);
  loading = signal(true);
  cartItems = signal<CartItem[]>([]);
  isCartOpen = signal(false);
  isCheckoutOpen = signal(false);
  pendingCheckout = false;
  toastMessage = signal<string | null>(null);
  currentYear = new Date().getFullYear();

  // Simple Customer Auth Modal
  isAuthModalOpen = signal(false);
  authTab = signal<'login' | 'register'>('login');
  authPromptNotice = signal<string | null>(null);

  // Login Form (Email ID & Password only)
  loginEmail = '';
  loginPassword = '';

  // Sign Up Form (Full Name, Email ID, Password only)
  registerFullName = '';
  registerEmail = '';
  registerPassword = '';

  isAuthSubmitting = signal(false);
  authError = signal<string | null>(null);

  // Customer Orders Modal & Auto-sync
  isOrdersModalOpen = signal(false);
  loadingOrders = signal(false);
  customerOrders = signal<CustomerOrder[]>([]);
  private ordersPollInterval: any = null;

  // Checkout Form
  checkoutForm = {
    recipientName: '',
    email: '',
    phone: '',
    streetAddress: '742 Evergreen Terrace, Suite 500',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94107',
    paymentMethod: 'card',
  };
  isSubmittingOrder = signal(false);
  checkoutError = signal<string | null>(null);
  downloadingBill = signal(false);
  downloadingOrderId = signal<string | null>(null);
  confirmedOrder = signal<{
    orderNumber: string;
    recipientName: string;
    email: string;
    totalAmount: number;
    fullOrder?: any;
  } | null>(null);

  ngOnInit(): void {
    this.fetchSiteContent();
    this.fetchProducts();

    // Load active customer cart and orders if logged in
    this.loadCartForActiveUser();
    if (this.authService.currentCustomer()) {
      this.syncUserToCheckout();
      this.fetchCustomerOrders();
    }
  }

  ngOnDestroy(): void {
    if (this.ordersPollInterval) {
      clearInterval(this.ordersPollInterval);
      this.ordersPollInterval = null;
    }
  }

  fetchSiteContent(): void {
    this.http.get<{ success: boolean; data: any }>(this.contentUrl).subscribe({
      next: (res) => {
        if (res.data) {
          this.siteContent.set({ ...this.siteContent(), ...res.data });
        }
      },
      error: () => {},
    });
  }

  // --- Cart Isolation Methods ---
  private getCartStorageKey(): string {
    const user = this.authService.currentCustomer();
    return user ? `luxe_cart_user_${user.id}` : `luxe_cart_guest`;
  }

  private saveActiveCart(): void {
    try {
      localStorage.setItem(this.getCartStorageKey(), JSON.stringify(this.cartItems()));
    } catch {}
  }

  private loadCartForActiveUser(): void {
    try {
      const userKey = this.getCartStorageKey();
      const userRaw = localStorage.getItem(userKey);
      if (userRaw) {
        const parsed = JSON.parse(userRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cartItems.set(parsed);
          return;
        }
      }

      // Check if there was a guest cart to migrate into user session
      const guestRaw = localStorage.getItem('luxe_cart_guest');
      if (guestRaw) {
        const guestItems = JSON.parse(guestRaw);
        if (Array.isArray(guestItems) && guestItems.length > 0) {
          this.cartItems.set(guestItems);
          this.saveActiveCart();
          localStorage.removeItem('luxe_cart_guest');
          return;
        }
      }

      // If in-memory cartItems already has items, preserve them into user storage!
      if (this.cartItems().length > 0) {
        this.saveActiveCart();
        return;
      }
    } catch {}
    this.cartItems.set([]);
  }

  fetchProducts(): void {
    this.loading.set(true);
    this.http.get<{ success: boolean; data: any }>(this.apiUrl).subscribe({
      next: (res) => {
        const rawList = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        const list: StoreProduct[] = rawList.map((p: any) => ({
          ...p,
          selectedQty: 0,
        }));
        this.products.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products from API:', err);
        this.loading.set(false);
      },
    });
  }

  getProductImage(p: StoreProduct): string {
    if (p.images && p.images.length > 0 && p.images[0].image_url) {
      const u = p.images[0].image_url;
      if (u.startsWith('/uploads')) {
        const apiHost = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
        return `${apiHost}${u}`;
      }
      return u;
    }
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=75';
  }

  incrementQty(p: StoreProduct): void {
    if (p.selectedQty < p.stock_quantity) {
      p.selectedQty++;
    }
  }

  decrementQty(p: StoreProduct): void {
    if (p.selectedQty > 0) {
      p.selectedQty--;
    }
  }

  addToCart(p: StoreProduct): void {
    const qty = p.selectedQty > 0 ? p.selectedQty : 1;
    const current = [...this.cartItems()];
    const existing = current.find((item) => item.product.id === p.id);

    if (existing) {
      existing.quantity += qty;
      existing.lineTotal = existing.quantity * existing.product.base_price;
    } else {
      current.push({
        product: p,
        quantity: qty,
        lineTotal: qty * p.base_price,
      });
    }

    this.cartItems.set(current);
    this.saveActiveCart();
    this.showToast(`Added ${qty}x ${p.name} to Bag`);
    this.isCartOpen.set(true);
  }

  buyNow(p: StoreProduct): void {
    this.addToCart(p);
    this.openCheckout();
  }

  updateCartQty(item: CartItem, delta: number): void {
    const updated = this.cartItems()
      .map((it) => {
        if (it.product.id === item.product.id) {
          const newQty = it.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...it,
            quantity: newQty,
            lineTotal: newQty * it.product.base_price,
          };
        }
        return it;
      })
      .filter((it): it is CartItem => it !== null);

    this.cartItems.set(updated);
    this.saveActiveCart();
  }

  removeCartItem(item: CartItem): void {
    this.cartItems.set(this.cartItems().filter((it) => it.product.id !== item.product.id));
    this.saveActiveCart();
  }

  cartTotalCount(): number {
    return this.cartItems().reduce((acc, it) => acc + it.quantity, 0);
  }

  cartSubtotal(): number {
    return this.cartItems().reduce((acc, it) => acc + it.lineTotal, 0);
  }

  toggleCart(): void {
    this.isCartOpen.update((open) => !open);
  }

  closeCart(): void {
    this.isCartOpen.set(false);
  }

  // --- Checkout Gate (Login Required First) ---
  openCheckout(): void {
    this.closeCart();

    // If customer has NOT logged in, require login first before checkout
    if (!this.authService.currentCustomer()) {
      this.pendingCheckout = true;
      this.authPromptNotice.set('Please sign in to proceed to checkout.');
      this.openAuthModal('login');
      return;
    }

    // Customer is already logged in -> proceed directly to checkout
    this.syncUserToCheckout();
    this.isCheckoutOpen.set(true);
  }

  closeCheckout(): void {
    this.isCheckoutOpen.set(false);
  }

  syncUserToCheckout(): void {
    const user = this.authService.currentCustomer();
    if (user) {
      this.checkoutForm.recipientName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      this.checkoutForm.email = user.email || '';
      if (user.phone) this.checkoutForm.phone = user.phone;
    }
  }

  placeOrder(e: Event): void {
    e.preventDefault();
    if (this.cartItems().length === 0) {
      this.checkoutError.set('Your bag is currently empty. Please select a product before checking out.');
      return;
    }

    this.isSubmittingOrder.set(true);
    this.checkoutError.set(null);

    const user = this.authService.currentCustomer();
    const guestEmail = (user?.email || this.checkoutForm.email || 'customer@example.com').trim();
    const recipient = (this.checkoutForm.recipientName || user?.first_name || 'Valued Customer').trim();
    const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const totalAmount = this.cartSubtotal();

    const payload = {
      guest_email: guestEmail,
      shipping_address: {
        recipient_name: recipient,
        street_address: (this.checkoutForm.streetAddress || '742 Evergreen Terrace').trim(),
        city: (this.checkoutForm.city || 'San Francisco').trim(),
        state: (this.checkoutForm.state || 'CA').trim(),
        postal_code: (this.checkoutForm.postalCode || '94107').trim(),
        country: 'United States',
        phone: (this.checkoutForm.phone || user?.phone || '+1 555-0142').trim(),
      },
      payment_method: this.checkoutForm.paymentMethod === 'card' ? 'credit_card' : 'cash_on_delivery',
      shipping_method: 'FedEx Express Worldwide Air',
      items: this.cartItems().map((it) => ({
        product_id: it.product.id,
        quantity: it.quantity,
        unit_price: it.product.base_price,
      })),
    };

    this.http.post<{ success: boolean; data: any }>(`${this.orderUrl}/checkout`, payload).subscribe({
      next: (res) => {
        this.isSubmittingOrder.set(false);
        this.isCheckoutOpen.set(false);
        const backendOrder = res.data;
        const finalNum = backendOrder?.order_number || orderNumber;

        this.confirmedOrder.set({
          orderNumber: finalNum,
          recipientName: recipient,
          email: guestEmail,
          totalAmount: backendOrder?.total_amount || totalAmount,
          fullOrder: backendOrder,
        });

        // Store into local cache and state immediately
        const existingList = this.getCustomerOrdersFromCache(guestEmail);
        const updatedList = [backendOrder, ...existingList.filter((o) => o.order_number !== finalNum)];
        this.saveCustomerOrdersToCache(guestEmail, updatedList);
        this.customerOrders.set(updatedList);

        this.cartItems.set([]);
        this.saveActiveCart();
        this.fetchCustomerOrders(false);
      },
      error: (err) => {
        this.isSubmittingOrder.set(false);
        const detail =
          err.error?.errors?.[0]?.message ||
          err.error?.message ||
          'Failed to place order. Please verify connection and details.';
        this.checkoutError.set(detail);
      },
    });
  }

  async downloadConfirmationBill(): Promise<void> {
    const confirmed = this.confirmedOrder();
    if (!confirmed) return;
    this.downloadingBill.set(true);
    try {
      const orderData = confirmed.fullOrder || {
        order_number: confirmed.orderNumber,
        invoice_number: `INV-${confirmed.orderNumber.replace('ORD-', '')}`,
        created_at: new Date(),
        shipping_address_json: {
          recipient_name: confirmed.recipientName,
          email: confirmed.email,
          phone: this.checkoutForm.phone || '+91 98765 43210',
          street_address: this.checkoutForm.streetAddress,
          city: this.checkoutForm.city,
          state: this.checkoutForm.state,
          postal_code: this.checkoutForm.postalCode,
        },
        items: [
          {
            product_name: 'Bespoke Luxury Creation',
            sku: 'SKU-BESPOKE',
            quantity: 1,
            unit_price: confirmed.totalAmount,
            line_total: confirmed.totalAmount,
          },
        ],
        subtotal: confirmed.totalAmount,
        total_amount: confirmed.totalAmount,
        payment_method: this.checkoutForm.paymentMethod === 'card' ? 'credit_card' : 'cash_on_delivery',
        payment_status: 'paid',
        tracking_number: 'TRK-FX-' + Math.floor(100000000 + Math.random() * 900000000),
      };

      await this.exportService.generateOrderInvoicePdf(orderData);
      this.showToast('Official Bill (PDF) downloaded successfully!');
    } catch (err) {
      console.error('Invoice generation error:', err);
      this.showToast('Failed to download bill. Please try again.');
    } finally {
      this.downloadingBill.set(false);
    }
  }

  async downloadOrderBill(order: CustomerOrder): Promise<void> {
    this.downloadingOrderId.set(order.id);
    try {
      await this.exportService.generateOrderInvoicePdf(order);
      this.showToast(`Bill for ${order.order_number} downloaded.`);
    } catch (err) {
      console.error('Invoice generation error:', err);
      this.showToast('Failed to download bill. Please try again.');
    } finally {
      this.downloadingOrderId.set(null);
    }
  }

  closeConfirmation(): void {
    this.confirmedOrder.set(null);
  }

  // --- Simple Customer Auth Actions ---
  openAuthModal(tab: 'login' | 'register'): void {
    this.authTab.set(tab);
    this.authError.set(null);
    this.isAuthModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.isAuthModalOpen.set(false);
    this.authError.set(null);
    this.authPromptNotice.set(null);
  }

  switchAuthTab(tab: 'login' | 'register'): void {
    this.authTab.set(tab);
    this.authError.set(null);
  }

  submitLogin(e: Event): void {
    e.preventDefault();
    if (!this.loginEmail || !this.loginPassword) return;

    this.isAuthSubmitting.set(true);
    this.authError.set(null);

    this.authService.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: (res) => {
        this.isAuthSubmitting.set(false);
        this.closeAuthModal();
        this.syncUserToCheckout();
        this.loadCartForActiveUser();
        this.fetchCustomerOrders();

        // If customer was trying to checkout, proceed directly to checkout now
        if (this.pendingCheckout) {
          this.pendingCheckout = false;
          this.isCheckoutOpen.set(true);
          this.showToast(`Signed in! Proceeding to checkout.`);
        } else {
          this.showToast(`Welcome back, ${res.data.user.first_name}!`);
        }
      },
      error: (err) => {
        this.isAuthSubmitting.set(false);
        const detail = err.error?.errors?.[0]?.message || err.error?.message || 'Invalid Email ID or Password';
        this.authError.set(detail);
      },
    });
  }

  submitRegister(e: Event): void {
    e.preventDefault();
    if (!this.registerEmail || !this.registerPassword) return;

    this.isAuthSubmitting.set(true);
    this.authError.set(null);

    const cleanName = (this.registerFullName || '').trim();
    const parts = cleanName ? cleanName.split(' ') : [];
    const firstName = parts[0] || 'Customer';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email: this.registerEmail.trim().toLowerCase(),
      password: this.registerPassword,
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isAuthSubmitting.set(false);
        this.closeAuthModal();
        this.syncUserToCheckout();
        this.loadCartForActiveUser();
        this.fetchCustomerOrders();

        if (this.pendingCheckout) {
          this.pendingCheckout = false;
          this.isCheckoutOpen.set(true);
          this.showToast(`Account created! Proceeding to checkout.`);
        } else {
          this.showToast(`Account created! Welcome, ${res.data.user.first_name}!`);
        }
      },
      error: (err) => {
        this.isAuthSubmitting.set(false);
        const detail = err.error?.errors?.[0]?.message || err.error?.message || 'Unable to create account. Please verify details.';
        this.authError.set(detail);
      },
    });
  }

  logoutCustomer(): void {
    this.authService.logoutCustomer();
    this.cartItems.set([]);
    this.customerOrders.set([]);
    this.isCartOpen.set(false);
    this.isOrdersModalOpen.set(false);
    this.isCheckoutOpen.set(false);
    this.loadCartForActiveUser();
    this.showToast('You have been signed out.');
  }

  // --- Customer Orders Actions (Strict Isolation, Caching & Realtime Status Sync) ---
  private getOrderCacheKey(email?: string): string {
    const mail = (email || this.authService.currentCustomer()?.email || 'guest').toLowerCase().trim();
    return `luxe_orders_${mail}`;
  }

  private getCustomerOrdersFromCache(email?: string): CustomerOrder[] {
    try {
      const raw = localStorage.getItem(this.getOrderCacheKey(email));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveCustomerOrdersToCache(email: string, orders: CustomerOrder[]): void {
    try {
      localStorage.setItem(this.getOrderCacheKey(email), JSON.stringify(orders));
    } catch {}
  }

  private mergeOrders(serverOrders: CustomerOrder[], email: string): CustomerOrder[] {
    const cached = this.getCustomerOrdersFromCache(email);
    const map = new Map<string, CustomerOrder>();

    // 1. Seed from cache so existing placed orders are never dropped
    for (const ord of cached) {
      if (ord && ord.order_number) {
        map.set(ord.order_number, ord);
      }
    }

    // 2. Server orders take precedence for status updates, tracking numbers, and details
    for (const ord of serverOrders) {
      if (ord && ord.order_number) {
        map.set(ord.order_number, ord);
      }
    }

    const result = Array.from(map.values());
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }

  openOrdersModal(): void {
    this.confirmedOrder.set(null);
    this.isOrdersModalOpen.set(true);

    const user = this.authService.currentCustomer();
    if (user?.email) {
      const cached = this.getCustomerOrdersFromCache(user.email);
      if (cached.length > 0) {
        this.customerOrders.set(cached);
      }
    }

    this.fetchCustomerOrders();

    if (this.ordersPollInterval) clearInterval(this.ordersPollInterval);
    this.ordersPollInterval = setInterval(() => {
      if (this.isOrdersModalOpen()) {
        this.fetchCustomerOrders(false);
      }
    }, 4000);
  }

  closeOrdersModal(): void {
    this.isOrdersModalOpen.set(false);
    if (this.ordersPollInterval) {
      clearInterval(this.ordersPollInterval);
      this.ordersPollInterval = null;
    }
  }

  fetchCustomerOrders(showSpinner = true): void {
    const user = this.authService.currentCustomer();
    if (!user) {
      this.customerOrders.set([]);
      return;
    }

    // Seed immediate UI from local cache if empty
    const cached = this.getCustomerOrdersFromCache(user.email);
    if (cached.length > 0 && this.customerOrders().length === 0) {
      this.customerOrders.set(cached);
    }

    if (showSpinner && this.customerOrders().length === 0) {
      this.loadingOrders.set(true);
    }

    const query = user.email ? `?email=${encodeURIComponent(user.email)}` : '';
    this.http.get<{ success: boolean; data: CustomerOrder[] }>(`${this.orderUrl}/my-orders${query}`).subscribe({
      next: (res) => {
        const serverOrders = res.data || [];
        const merged = this.mergeOrders(serverOrders, user.email);
        this.customerOrders.set(merged);
        this.saveCustomerOrdersToCache(user.email, merged);
        if (showSpinner) this.loadingOrders.set(false);
      },
      error: () => {
        if (showSpinner) this.loadingOrders.set(false);
      },
    });
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
