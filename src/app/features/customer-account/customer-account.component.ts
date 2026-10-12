import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-customer-account',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="account-page py-5">
      <div class="container">
        <!-- Account Profile Banner -->
        <div class="profile-card card mb-4 flex-between">
          <div class="profile-meta flex gap-3 items-center">
            <div class="avatar-large">{{ authService.currentUser()?.first_name?.charAt(0) }}</div>
            <div>
              <h1 class="text-xl font-extrabold mb-1">
                {{ authService.currentUser()?.first_name }} {{ authService.currentUser()?.last_name }}
              </h1>
              <p class="text-xs text-muted">{{ authService.currentUser()?.email }}</p>
            </div>
          </div>

          <div class="loyalty-pill text-right">
            <span class="badge badge-gold mb-1">PLATINUM CLUB</span>
            <div class="text-xs text-muted">Concierge Status Active</div>
          </div>
        </div>

        <!-- Orders History -->
        <div class="orders-section">
          <h2 class="text-xl font-bold mb-3">Order History &amp; Tracking</h2>

          <div *ngIf="loading()" class="text-center py-4">
            <div class="spinner"></div>
            <span class="text-sm text-muted">Retrieving order history...</span>
          </div>

          <div *ngIf="!loading() && orders().length === 0" class="card text-center py-5">
            <p class="text-muted text-sm mb-3">You haven't placed any orders yet.</p>
            <a routerLink="/products" class="btn btn-primary btn-sm">Start Shopping</a>
          </div>

          <div *ngIf="!loading() && orders().length > 0" class="orders-list flex flex-col gap-3">
            <div *ngFor="let order of orders()" class="order-card card">
              <div class="order-top-row flex-between pb-3 border-bottom mb-3">
                <div>
                  <span class="text-xs text-muted block">ORDER REFERENCE</span>
                  <strong class="text-sm text-primary">{{ order.order_number }}</strong>
                </div>

                <div>
                  <span class="text-xs text-muted block">DATE PLACED</span>
                  <span class="text-xs font-semibold">{{ order.created_at | date: 'mediumDate' }}</span>
                </div>

                <div>
                  <span class="text-xs text-muted block">TOTAL AMOUNT</span>
                  <strong class="text-sm text-primary">₹{{ order.total_amount | number: '1.2-2' }}</strong>
                </div>

                <div>
                  <span class="badge" [class.badge-success]="order.status === 'delivered'" [class.badge-info]="order.status !== 'delivered'">
                    {{ order.status | uppercase }}
                  </span>
                </div>

                <button (click)="viewInvoice(order)" class="btn btn-secondary btn-sm">
                  View Invoice
                </button>
              </div>

              <!-- Order Items Summary -->
              <div class="order-items-preview flex gap-3 flex-wrap">
                <div *ngFor="let item of order.items" class="item-chip flex gap-2 items-center">
                  <img *ngIf="item.product_image_url" [src]="item.product_image_url" class="w-8 h-8 rounded object-cover" />
                  <span class="text-xs font-semibold">{{ item.product_name }} &times; {{ item.quantity }}</span>
                </div>
              </div>

              <div *ngIf="order.tracking_number" class="tracking-pill mt-3 text-xs text-muted">
                📦 Tracking Carrier Reference: <strong class="text-primary">{{ order.tracking_number }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invoice Modal -->
    <div class="modal-backdrop" *ngIf="selectedInvoice()" (click)="selectedInvoice.set(null)">
      <div class="modal-dialog p-5" (click)="$event.stopPropagation()">
        <div class="invoice-header flex-between mb-4 border-bottom pb-3">
          <div>
            <h2 class="text-xl font-bold">LUXE STUDIO INVOICE</h2>
            <span class="text-xs text-muted">Ref: {{ selectedInvoice()?.order_number }}</span>
          </div>
          <button (click)="selectedInvoice.set(null)" class="text-xl font-bold">&times;</button>
        </div>

        <div class="invoice-body text-xs mb-4">
          <div class="flex-between py-1">
            <span>Date:</span>
            <span>{{ selectedInvoice()?.created_at | date: 'fullDate' }}</span>
          </div>
          <div class="flex-between py-1">
            <span>Payment Method:</span>
            <span class="uppercase font-semibold">{{ selectedInvoice()?.payment_method }}</span>
          </div>
          <div class="flex-between py-1">
            <span>Payment Status:</span>
            <span class="badge badge-success">{{ selectedInvoice()?.payment_status | uppercase }}</span>
          </div>

          <div class="invoice-items mt-3 pt-3 border-top">
            <h4 class="font-bold mb-2">Ordered Items:</h4>
            <div *ngFor="let it of selectedInvoice()?.items" class="flex-between py-1 border-bottom">
              <span>{{ it.product_name }} ({{ it.sku }}) &times; {{ it.quantity }}</span>
              <span>₹{{ it.line_total | number: '1.2-2' }}</span>
            </div>
          </div>

          <div class="invoice-totals mt-3 pt-2 text-right">
            <div class="py-1">Subtotal: ₹{{ selectedInvoice()?.subtotal | number: '1.2-2' }}</div>
            <div class="py-1" *ngIf="selectedInvoice()?.discount_amount">Discount: -₹{{ selectedInvoice()?.discount_amount | number: '1.2-2' }}</div>
            <div class="py-1">Tax: ₹{{ selectedInvoice()?.tax_amount | number: '1.2-2' }}</div>
            <div class="py-1 font-bold text-sm text-primary">Final Total: ₹{{ selectedInvoice()?.total_amount | number: '1.2-2' }}</div>
          </div>
        </div>

        <button (click)="selectedInvoice.set(null)" class="btn btn-primary btn-sm w-full">Close Invoice</button>
      </div>
    </div>
  `,
  styles: [`
    .avatar-large {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: var(--color-primary);
      color: #ffffff;
      font-size: 1.5rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .item-chip {
      background: var(--color-surface-subtle);
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
    }
    .w-8 { width: 2rem; }
    .h-8 { height: 2rem; }
    .border-bottom { border-bottom: 1px solid var(--color-surface-border); }
    .border-top { border-top: 1px solid var(--color-surface-border); }
    .w-full { width: 100%; }
    .py-5 { padding-top: 3rem; padding-bottom: 3rem; }
  `],
})
export class CustomerAccountComponent implements OnInit {
  authService = inject(AuthService);
  private orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  selectedInvoice = signal<Order | null>(null);

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        if (res.success) {
          this.orders.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  viewInvoice(order: Order): void {
    this.selectedInvoice.set(order);
  }
}
