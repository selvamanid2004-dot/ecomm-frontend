import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { Product } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-admin-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-pricing-page">
      <!-- Page Header -->
      <div class="page-header mb-6">
        <h1 class="page-title text-2xl font-extrabold text-slate-900">Price Management Console</h1>
        <p class="text-xs text-muted mt-1">
          Adjust selling prices, set promotional compare-at anchors, and audit price movements in the database.
        </p>
      </div>

      <!-- Success Notification Alert -->
      <div *ngIf="successMessage()" class="admin-alert-success mb-6">
        <div class="flex items-center gap-2">
          <span>✅</span>
          <span class="text-xs font-bold">{{ successMessage() }}</span>
        </div>
        <button (click)="successMessage.set(null)" class="modal-close-btn" title="Dismiss">&times;</button>
      </div>

      <div class="pricing-console-grid">
        <!-- Price Adjustment Form Card -->
        <div class="card p-6 shadow-sm">
          <div class="border-b pb-3 mb-4 flex-between">
            <div>
              <h2 class="text-base font-bold text-slate-900">Modify Product Price</h2>
              <span class="text-xs text-muted">Update live storefront pricing</span>
            </div>
            <span class="badge badge-gold text-xs">DYNAMIC PRICING</span>
          </div>

          <form (submit)="submitPriceChange($event)">
            <div class="form-group mb-4">
              <label class="form-label">Target Product *</label>
              <select [(ngModel)]="selectedProductId" (change)="onProductSelect()" name="productId" required class="form-control">
                <option value="">-- Choose Product to Adjust --</option>
                <option *ngFor="let p of products()" [value]="p.id">
                  {{ p.name }} (Current: ₹{{ p.base_price }})
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-4">
              <div class="form-group">
                <div class="flex-between items-center mb-1">
                  <label class="form-label mb-0">New Selling Price (₹) *</label>
                  <span class="text-xs font-semibold text-slate-500">₹1 per step</span>
                </div>
                <div class="price-stepper-wrap">
                  <span class="price-stepper-prefix">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    [(ngModel)]="newBasePrice"
                    name="basePrice"
                    required
                    class="price-stepper-input font-mono"
                    placeholder="2999.00"
                  />
                  <div class="price-stepper-controls">
                    <button
                      type="button"
                      (click)="stepBasePrice(1)"
                      class="price-stepper-btn btn-up"
                      title="Increase price by ₹1"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      (click)="stepBasePrice(-1)"
                      [disabled]="(newBasePrice || 0) <= 0"
                      class="price-stepper-btn btn-down"
                      title="Decrease price by ₹1"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <div class="flex-between items-center mb-1">
                  <label class="form-label mb-0">Compare At Price (₹)</label>
                  <span class="text-xs font-semibold text-slate-500">₹1 per step</span>
                </div>
                <div class="price-stepper-wrap">
                  <span class="price-stepper-prefix">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    [(ngModel)]="newComparePrice"
                    name="comparePrice"
                    class="price-stepper-input font-mono"
                    placeholder="3499.00"
                  />
                  <div class="price-stepper-controls">
                    <button
                      type="button"
                      (click)="stepComparePrice(1)"
                      class="price-stepper-btn btn-up"
                      title="Increase compare price by ₹1"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      (click)="stepComparePrice(-1)"
                      [disabled]="(newComparePrice || 0) <= 0"
                      class="price-stepper-btn btn-down"
                      title="Decrease compare price by ₹1"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group mb-5">
              <label class="form-label">Audit Justification / Reason *</label>
              <input
                type="text"
                [(ngModel)]="auditReason"
                name="reason"
                required
                class="form-control"
                placeholder="e.g. Festival promotional campaign or cost revision"
              />
              <span class="text-xs text-slate-500 mt-1 block">Logged to the immutable price history audit trail.</span>
            </div>

            <button
              type="submit"
              [disabled]="submitting() || !selectedProductId || !newBasePrice || !auditReason"
              class="btn btn-brand btn-sm w-full font-bold py-2.5"
            >
              {{ submitting() ? 'Updating Price & Logging Audit...' : 'Execute Dynamic Price Change' }}
            </button>
          </form>
        </div>

        <!-- Product Price History Card -->
        <div class="card p-0 overflow-hidden shadow-sm">
          <div class="card-header-bar flex-between">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Price History &amp; Audit Trail</h2>
              <span class="text-xs text-muted" *ngIf="selectedProduct()">Auditing for: <strong>{{ selectedProduct()?.name }}</strong></span>
              <span class="text-xs text-muted" *ngIf="!selectedProduct()">Select a product on the left to inspect history</span>
            </div>
            <span class="badge badge-slate text-xs">{{ priceHistory().length }} Logs</span>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Old Price</th>
                  <th>New Price</th>
                  <th>Audit Reason</th>
                  <th>Logged Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of priceHistory()">
                  <td class="text-muted line-through text-xs">₹{{ h.old_price | number: '1.2-2' }}</td>
                  <td>
                    <strong class="font-bold text-amber-700 text-xs">₹{{ h.new_price | number: '1.2-2' }}</strong>
                  </td>
                  <td class="text-xs text-slate-700">{{ h.reason }}</td>
                  <td class="text-xs text-muted">{{ h.created_at | date: 'mediumDate' }}</td>
                </tr>
                <tr *ngIf="priceHistory().length === 0">
                  <td colspan="4" class="text-center text-xs text-muted py-10">
                    {{ selectedProductId ? 'No previous price adjustments recorded for this item.' : 'Select a product from the dropdown to review its price history.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pricing-console-grid {
      display: grid;
      grid-template-columns: 390px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    .w-full { width: 100%; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
    .line-through { text-decoration: line-through; }
    .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; }
    @media (max-width: 1024px) {
      .pricing-console-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminPricingComponent implements OnInit {
  private adminService = inject(AdminService);

  products = signal<Product[]>([]);
  priceHistory = signal<any[]>([]);
  selectedProductId = '';
  selectedProduct = signal<Product | null>(null);

  newBasePrice: number | null = null;
  newComparePrice: number | null = null;
  auditReason = '';

  submitting = signal(false);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.adminService.getProducts({ limit: 50 }).subscribe((res) => {
      if (res.success) this.products.set(res.data);
    });
  }

  onProductSelect(): void {
    const p = this.products().find((item) => item.id === this.selectedProductId);
    if (p) {
      this.selectedProduct.set(p);
      this.newBasePrice = p.base_price;
      this.newComparePrice = p.compare_at_price || null;
      this.fetchPriceHistory(p.id);
    } else {
      this.selectedProduct.set(null);
      this.priceHistory.set([]);
    }
  }

  fetchPriceHistory(id: string): void {
    this.adminService.getPriceHistory(id).subscribe((res) => {
      if (res.success) this.priceHistory.set(res.data);
    });
  }

  stepBasePrice(delta: number): void {
    const cur = Number(this.newBasePrice) || 0;
    const next = Math.max(0, cur + delta);
    this.newBasePrice = Math.round(next * 100) / 100;
  }

  stepComparePrice(delta: number): void {
    const cur = Number(this.newComparePrice) || 0;
    const next = Math.max(0, cur + delta);
    this.newComparePrice = Math.round(next * 100) / 100;
  }

  submitPriceChange(e: Event): void {
    e.preventDefault();
    if (!this.selectedProductId || !this.newBasePrice || !this.auditReason) return;

    this.submitting.set(true);
    this.successMessage.set(null);

    this.adminService
      .updatePrice(
        this.selectedProductId,
        this.newBasePrice,
        this.newComparePrice,
        this.auditReason
      )
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.successMessage.set('Dynamic price successfully updated and logged.');
          this.auditReason = '';
          this.fetchPriceHistory(this.selectedProductId);

          // Update local product price in list
          const p = this.products().find((item) => item.id === this.selectedProductId);
          if (p) {
            p.base_price = res.data.product.base_price;
            p.compare_at_price = res.data.product.compare_at_price;
          }
        },
        error: () => this.submitting.set(false),
      });
  }
}
