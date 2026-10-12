import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="cart-page py-5">
      <div class="container">
        <h1 class="page-title mb-4">Shopping Bag</h1>

        <!-- Empty Cart State -->
        <div *ngIf="cartService.itemCount() === 0" class="empty-cart-card card text-center py-5">
          <div class="empty-icon mb-3">🛍️</div>
          <h2 class="text-xl font-bold mb-2">Your Shopping Bag is Empty</h2>
          <p class="text-sm text-muted mb-4 max-w-md mx-auto">
            You haven't selected any luxury pieces yet. Explore our bespoke catalog to find precision-crafted audio and titanium essentials.
          </p>
          <a routerLink="/products" class="btn btn-brand btn-lg">Explore Catalog &rarr;</a>
        </div>

        <!-- Populated Cart Layout -->
        <div *ngIf="cartService.itemCount() > 0" class="cart-grid">
          <!-- Items List Column -->
          <div class="cart-items-col">
            <div class="card p-0 overflow-hidden">
              <div class="cart-header-row">
                <span>Creations</span>
                <span>Quantity</span>
                <span>Line Total</span>
              </div>

              <div *ngFor="let item of cartService.cart()?.items" class="cart-item-row">
                <!-- Thumbnail & Meta -->
                <div class="item-meta">
                  <img
                    [src]="item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'"
                    [alt]="item.productName"
                    class="item-img"
                  />
                  <div>
                    <h3 class="item-title">
                      <a [routerLink]="['/products', item.slug]">{{ item.productName }}</a>
                    </h3>
                    <span *ngIf="item.variantTitle" class="item-variant text-xs text-muted block mb-1">
                      Variant: {{ item.variantTitle }}
                    </span>
                    <span class="item-price text-sm font-semibold">₹{{ item.unitPrice | number: '1.2-2' }}</span>
                  </div>
                </div>

                <!-- Quantity Control -->
                <div class="item-qty-cell">
                  <div class="qty-control">
                    <button
                      (click)="cartService.updateQuantity(item.id, item.quantity - 1).subscribe()"
                      class="qty-btn"
                    >
                      &minus;
                    </button>
                    <span class="qty-num">{{ item.quantity }}</span>
                    <button
                      (click)="cartService.updateQuantity(item.id, item.quantity + 1).subscribe()"
                      [disabled]="item.quantity >= item.stockAvailable"
                      class="qty-btn"
                    >
                      &plus;
                    </button>
                  </div>
                  <button (click)="cartService.removeItem(item.id).subscribe()" class="btn-remove-link text-xs">
                    Remove
                  </button>
                </div>

                <!-- Total -->
                <div class="item-total-cell font-bold">
                  ₹{{ item.lineTotal | number: '1.2-2' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Summary Column -->
          <div class="cart-summary-col">
            <div class="card">
              <h2 class="summary-heading mb-3">Order Summary</h2>

              <!-- Coupon Code Form -->
              <div class="coupon-box mb-4">
                <div class="flex gap-2" *ngIf="!cartService.cart()?.couponCode; else appliedCouponTpl">
                  <input
                    type="text"
                    [(ngModel)]="couponCodeInput"
                    placeholder="Promo code (e.g. LUXE10)"
                    class="form-control text-sm uppercase"
                  />
                  <button
                    (click)="applyCoupon()"
                    [disabled]="!couponCodeInput.trim() || applyingCoupon()"
                    class="btn btn-secondary btn-sm"
                  >
                    {{ applyingCoupon() ? '...' : 'Apply' }}
                  </button>
                </div>

                <div *ngIf="couponError()" class="text-xs text-danger mt-1">
                  {{ couponError() }}
                </div>

                <ng-template #appliedCouponTpl>
                  <div class="applied-coupon flex-between">
                    <span class="badge badge-gold">✦ {{ cartService.cart()?.couponCode }} APPLIED</span>
                    <button (click)="cartService.removeCoupon().subscribe()" class="text-xs text-danger hover:underline">
                      Remove
                    </button>
                  </div>
                </ng-template>
              </div>

              <!-- Cost Rows -->
              <div class="summary-rows text-sm">
                <div class="flex-between py-2">
                  <span class="text-muted">Subtotal</span>
                  <span class="font-semibold">₹{{ cartService.subtotal() | number: '1.2-2' }}</span>
                </div>

                <div class="flex-between py-2" *ngIf="cartService.cart()?.discountAmount">
                  <span class="text-muted">Promo Discount</span>
                  <span class="font-semibold text-brand">-₹{{ cartService.cart()?.discountAmount | number: '1.2-2' }}</span>
                </div>

                <div class="flex-between py-2">
                  <span class="text-muted">Express Courier Delivery</span>
                  <span class="font-semibold">
                    {{ (cartService.cart()?.shippingFee || 0) === 0 ? 'FREE' : ('₹' + (cartService.cart()?.shippingFee | number: '1.2-2')) }}
                  </span>
                </div>

                <div class="flex-between py-2">
                  <span class="text-muted">Estimated Tax (7.5%)</span>
                  <span class="font-semibold">₹{{ (cartService.cart()?.taxAmount || 0) | number: '1.2-2' }}</span>
                </div>

                <div class="total-row flex-between pt-3 mt-2 border-top">
                  <span class="font-bold text-base">Estimated Total</span>
                  <span class="font-extrabold text-xl text-primary">₹{{ cartService.totalAmount() | number: '1.2-2' }}</span>
                </div>
              </div>

              <a routerLink="/checkout" class="btn btn-brand btn-lg w-full mt-4">
                Proceed to Checkout &rarr;
              </a>

              <div class="text-center mt-3">
                <a routerLink="/products" class="text-xs text-muted hover:underline">Continue shopping</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .empty-icon { font-size: 3.5rem; }
    .cart-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2.5rem;
      align-items: start;
    }
    .cart-header-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      padding: 1rem 1.5rem;
      background: var(--color-surface-subtle);
      border-bottom: 1px solid var(--color-surface-border);
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .cart-item-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--color-surface-border);
    }
    .item-meta {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .item-img {
      width: 75px;
      height: 75px;
      border-radius: var(--radius-md);
      object-fit: cover;
      background: #f1f5f9;
    }
    .item-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
    }
    .item-qty-cell {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35rem;
    }
    .qty-control {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--color-surface-border);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .qty-btn {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface-subtle);
      font-weight: bold;
    }
    .qty-num {
      width: 2rem;
      text-align: center;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .btn-remove-link {
      color: var(--color-danger);
      background: none;
      cursor: pointer;
    }
    .item-total-cell {
      font-size: 1.1rem;
      color: var(--color-primary);
      text-align: right;
    }
    .summary-heading {
      font-size: 1.25rem;
      font-weight: 800;
    }
    .coupon-box {
      padding: 1rem;
      background: var(--color-surface-subtle);
      border-radius: var(--radius-md);
    }
    .border-top {
      border-top: 1.5px solid var(--color-surface-border);
    }
    .w-full { width: 100%; }
    .flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .py-5 { padding-top: 3rem; padding-bottom: 3rem; }
    @media (max-width: 900px) {
      .cart-grid { grid-template-columns: 1fr; }
      .cart-header-row { display: none; }
      .cart-item-row { grid-template-columns: 1fr; gap: 1rem; }
      .item-total-cell { text-align: left; }
    }
  `],
})
export class CartComponent {
  cartService = inject(CartService);

  couponCodeInput = '';
  applyingCoupon = signal(false);
  couponError = signal<string | null>(null);

  applyCoupon(): void {
    if (!this.couponCodeInput.trim()) return;
    this.applyingCoupon.set(true);
    this.couponError.set(null);

    this.cartService.applyCoupon(this.couponCodeInput.trim()).subscribe({
      next: () => {
        this.applyingCoupon.set(false);
        this.couponCodeInput = '';
      },
      error: (err) => {
        this.applyingCoupon.set(false);
        this.couponError.set(err.error?.message || 'Failed to apply coupon');
      },
    });
  }
}
