import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Order } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="checkout-page py-5">
      <div class="container">
        <!-- Order Confirmed State -->
        <div *ngIf="placedOrder()" class="order-confirmed-card card max-w-xl mx-auto text-center py-5">
          <div class="success-icon mb-3">✓</div>
          <span class="badge badge-success mb-2">ORDER CONFIRMED</span>
          <h1 class="text-2xl font-extrabold mb-1">Thank You for Your Order</h1>
          <p class="text-sm text-muted mb-4">
            Order Reference: <strong class="text-primary">{{ placedOrder()?.order_number }}</strong>
          </p>

          <div class="order-summary-box text-left p-4 mb-4 bg-subtle rounded-md text-sm">
            <div class="flex-between py-1">
              <span>Total Paid:</span>
              <span class="font-bold">₹{{ placedOrder()?.total_amount | number: '1.2-2' }}</span>
            </div>
            <div class="flex-between py-1">
              <span>Payment Method:</span>
              <span class="uppercase font-semibold">{{ placedOrder()?.payment_method }}</span>
            </div>
            <div class="flex-between py-1">
              <span>Delivery Status:</span>
              <span class="badge badge-info">{{ placedOrder()?.status | uppercase }}</span>
            </div>
          </div>

          <div class="flex-center gap-3">
            <a routerLink="/account" class="btn btn-primary">View in My Account &rarr;</a>
            <a routerLink="/products" class="btn btn-secondary">Continue Shopping</a>
          </div>
        </div>

        <!-- Checkout Form Layout -->
        <div *ngIf="!placedOrder()" class="checkout-grid">
          <!-- Checkout Steps Form Column -->
          <div class="checkout-form-col">
            <div class="checkout-step-card card mb-4">
              <h2 class="step-title">1. Delivery Destination</h2>

              <div class="form-grid">
                <div class="form-group col-span-2">
                  <label class="form-label">Full Recipient Name *</label>
                  <input type="text" [(ngModel)]="shipping.recipient_name" class="form-control" placeholder="e.g. Alexander Vance" />
                </div>

                <div class="form-group">
                  <label class="form-label">Phone Contact *</label>
                  <input type="text" [(ngModel)]="shipping.phone" class="form-control" placeholder="+1-555-0199" />
                </div>

                <div class="form-group">
                  <label class="form-label">Email (Order Confirmation) *</label>
                  <input type="email" [(ngModel)]="guestEmail" class="form-control" placeholder="alexander@domain.com" />
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Street Address *</label>
                  <input type="text" [(ngModel)]="shipping.street_address" class="form-control" placeholder="742 Evergreen Terrace" />
                </div>

                <div class="form-group">
                  <label class="form-label">Apartment / Suite</label>
                  <input type="text" [(ngModel)]="shipping.apartment" class="form-control" placeholder="Suite 400" />
                </div>

                <div class="form-group">
                  <label class="form-label">City *</label>
                  <input type="text" [(ngModel)]="shipping.city" class="form-control" placeholder="San Francisco" />
                </div>

                <div class="form-group">
                  <label class="form-label">State / Region *</label>
                  <input type="text" [(ngModel)]="shipping.state" class="form-control" placeholder="CA" />
                </div>

                <div class="form-group">
                  <label class="form-label">Postal / ZIP Code *</label>
                  <input type="text" [(ngModel)]="shipping.postal_code" class="form-control" placeholder="94107" />
                </div>
              </div>
            </div>

            <div class="checkout-step-card card mb-4">
              <h2 class="step-title">2. Payment Method</h2>

              <div class="payment-methods-grid">
                <label class="payment-card-option" [class.selected]="paymentMethod === 'credit_card'">
                  <input type="radio" name="payment" value="credit_card" [(ngModel)]="paymentMethod" />
                  <div class="payment-option-body">
                    <span class="payment-icon">💳</span>
                    <span class="font-bold">Credit / Debit Card</span>
                    <span class="text-xs text-muted">Visa, Mastercard, Amex</span>
                  </div>
                </label>

                <label class="payment-card-option" [class.selected]="paymentMethod === 'apple_pay'">
                  <input type="radio" name="payment" value="apple_pay" [(ngModel)]="paymentMethod" />
                  <div class="payment-option-body">
                    <span class="payment-icon"></span>
                    <span class="font-bold">Apple Pay</span>
                    <span class="text-xs text-muted">Touch ID Instant Checkout</span>
                  </div>
                </label>

                <label class="payment-card-option" [class.selected]="paymentMethod === 'paypal'">
                  <input type="radio" name="payment" value="paypal" [(ngModel)]="paymentMethod" />
                  <div class="payment-option-body">
                    <span class="payment-icon">🅿️</span>
                    <span class="font-bold">PayPal</span>
                    <span class="text-xs text-muted">Buyer Protection Guaranteed</span>
                  </div>
                </label>
              </div>

              <!-- Credit Card Fields Simulation -->
              <div *ngIf="paymentMethod === 'credit_card'" class="cc-fields mt-4 p-3 bg-subtle rounded-md">
                <div class="form-group mb-2">
                  <label class="form-label text-xs">Card Number</label>
                  <input type="text" value="•••• •••• •••• 4242" class="form-control text-sm" />
                </div>
                <div class="flex gap-2">
                  <div class="form-group flex-1">
                    <label class="form-label text-xs">Expires</label>
                    <input type="text" value="12/28" class="form-control text-sm" />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label text-xs">CVV</label>
                    <input type="text" value="•••" class="form-control text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="errorMessage()" class="alert-error card bg-danger-subtle text-danger mb-4 p-3 text-sm">
              {{ errorMessage() }}
            </div>

            <button
              (click)="submitOrder()"
              [disabled]="submitting() || !isFormValid()"
              class="btn btn-brand btn-lg w-full"
            >
              {{ submitting() ? 'Authorizing & Submitting Order...' : 'Authorize & Place Order (₹' + (cartService.totalAmount() | number: '1.2-2') + ')' }}
            </button>
          </div>

          <!-- Mini Summary Column -->
          <div class="checkout-summary-col">
            <div class="card">
              <h3 class="font-bold text-base mb-3">Order Overview ({{ cartService.itemCount() }} items)</h3>

              <div class="mini-items-list mb-3">
                <div *ngFor="let item of cartService.cart()?.items" class="mini-item flex-between py-2 border-bottom">
                  <div class="flex gap-2 items-center">
                    <img [src]="item.image" [alt]="item.productName" class="w-10 h-10 rounded object-cover" />
                    <div>
                      <span class="text-xs font-semibold block">{{ item.productName }}</span>
                      <span class="text-xs text-muted">Qty: {{ item.quantity }}</span>
                    </div>
                  </div>
                  <span class="text-xs font-bold">₹{{ item.lineTotal | number: '1.2-2' }}</span>
                </div>
              </div>

              <div class="summary-breakdown text-xs">
                <div class="flex-between py-1">
                  <span class="text-muted">Subtotal</span>
                  <span>₹{{ cartService.subtotal() | number: '1.2-2' }}</span>
                </div>
                <div class="flex-between py-1" *ngIf="cartService.cart()?.discountAmount">
                  <span class="text-muted">Coupon Discount</span>
                  <span class="text-brand">-₹{{ cartService.cart()?.discountAmount | number: '1.2-2' }}</span>
                </div>
                <div class="flex-between py-1">
                  <span class="text-muted">Express Shipping</span>
                  <span>{{ (cartService.cart()?.shippingFee || 0) === 0 ? 'FREE' : ('₹' + (cartService.cart()?.shippingFee | number: '1.2-2')) }}</span>
                </div>
                <div class="flex-between py-1">
                  <span class="text-muted">Tax</span>
                  <span>₹{{ (cartService.cart()?.taxAmount || 0) | number: '1.2-2' }}</span>
                </div>
                <div class="flex-between pt-2 border-top font-bold text-sm">
                  <span>Total Payable:</span>
                  <span class="text-primary text-base font-extrabold">₹{{ cartService.totalAmount() | number: '1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2.5rem;
      align-items: start;
    }
    .step-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--color-surface-border);
      padding-bottom: 0.75rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .col-span-2 { grid-column: span 2; }
    .payment-methods-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .payment-card-option {
      border: 1.5px solid var(--color-surface-border);
      border-radius: var(--radius-md);
      padding: 1rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all var(--transition-fast);
    }
    .payment-card-option input { display: none; }
    .payment-card-option.selected {
      border-color: var(--color-primary);
      background: var(--color-surface-subtle);
      box-shadow: 0 0 0 2px var(--color-primary);
    }
    .payment-icon { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .success-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: #10b981;
      color: #ffffff;
      font-size: 2rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .bg-subtle { background: var(--color-surface-subtle); }
    .bg-danger-subtle { background: #fef2f2; }
    .border-bottom { border-bottom: 1px solid var(--color-surface-border); }
    .border-top { border-top: 1px solid var(--color-surface-border); }
    .w-10 { width: 2.5rem; }
    .h-10 { height: 2.5rem; }
    .rounded { border-radius: var(--radius-sm); }
    .object-cover { object-fit: cover; }
    .w-full { width: 100%; }
    .py-5 { padding-top: 3rem; padding-bottom: 3rem; }
    @media (max-width: 900px) {
      .checkout-grid { grid-template-columns: 1fr; }
      .payment-methods-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CheckoutComponent implements OnInit {
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  shipping = {
    recipient_name: '',
    phone: '',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  };

  guestEmail = '';
  paymentMethod = 'credit_card';

  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  placedOrder = signal<Order | null>(null);

  ngOnInit(): void {
    if (this.cartService.itemCount() === 0 && !this.placedOrder()) {
      this.router.navigate(['/cart']);
    }

    const u = this.authService.currentUser();
    if (u) {
      this.shipping.recipient_name = `${u.first_name} ${u.last_name}`;
      this.shipping.phone = u.phone || '';
      this.guestEmail = u.email;
    }
  }

  isFormValid(): boolean {
    return !!(
      this.shipping.recipient_name &&
      this.shipping.phone &&
      this.shipping.street_address &&
      this.shipping.city &&
      this.shipping.state &&
      this.shipping.postal_code &&
      this.guestEmail
    );
  }

  submitOrder(): void {
    if (!this.isFormValid()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      shipping_address: this.shipping,
      billing_address: this.shipping,
      payment_method: this.paymentMethod,
      shipping_method: 'Standard Delivery',
      guest_email: this.guestEmail,
    };

    this.orderService.checkout(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.placedOrder.set(res.data);
          this.cartService.refreshCart().subscribe();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to place order. Please review your cart.');
      },
    });
  }
}
