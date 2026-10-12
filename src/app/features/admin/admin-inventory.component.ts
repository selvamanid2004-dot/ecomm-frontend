import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { Product } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-inventory-page">
      <!-- Page Header -->
      <div class="page-header mb-6">
        <h1 class="page-title text-2xl font-extrabold text-slate-900">Inventory &amp; Stock Operations</h1>
        <p class="text-xs text-muted mt-1">Monitor low stock thresholds, execute replenishments, and audit inventory levels.</p>
      </div>

      <!-- Low Stock Alerts Box -->
      <div class="card border-red-200 bg-red-50/50 mb-6 p-5" *ngIf="lowStockAlerts().length > 0">
        <div class="flex-between mb-3 border-b border-red-200 pb-2">
          <div class="flex gap-2 items-center">
            <span class="text-danger font-bold text-sm">⚠️ CRITICAL LOW STOCK WARNING</span>
            <span class="badge badge-danger text-xs">{{ lowStockAlerts().length }} Items</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div *ngFor="let item of lowStockAlerts()" class="alert-item p-3 bg-white rounded-lg border border-red-200 flex-between shadow-xs">
            <div>
              <strong class="text-sm text-slate-900 block font-bold">{{ item.name }}</strong>
              <span class="text-xs text-muted font-mono">{{ item.sku }}</span>
            </div>
            <div class="text-right">
              <span class="text-danger font-bold block text-sm">{{ item.stock_quantity }} Left</span>
              <button (click)="openAdjust(item)" class="btn btn-secondary btn-xs font-bold mt-1">Restock</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="card p-0 overflow-hidden shadow-sm">
        <div class="card-header-bar flex-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Active Product Inventory Levels</h2>
            <span class="text-xs text-muted">All active catalog stock</span>
          </div>
          <span class="badge badge-slate text-xs">{{ products().length }} Products</span>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of products()">
                <td>
                  <strong class="text-sm font-bold text-slate-900">{{ p.name }}</strong>
                </td>
                <td class="text-xs font-mono text-slate-700">{{ p.sku }}</td>
                <td class="text-xs text-slate-600">{{ p.category?.name || 'Standard' }}</td>
                <td class="font-bold">
                  <span [class.text-danger]="p.stock_quantity <= p.low_stock_threshold" [class.text-slate-900]="p.stock_quantity > p.low_stock_threshold">
                    {{ p.stock_quantity }} units
                  </span>
                </td>
                <td class="text-xs text-muted">{{ p.low_stock_threshold }}</td>
                <td>
                  <span class="badge" [class.badge-danger]="p.stock_quantity <= p.low_stock_threshold" [class.badge-success]="p.stock_quantity > p.low_stock_threshold">
                    {{ p.stock_quantity <= p.low_stock_threshold ? 'LOW STOCK' : 'OPTIMAL' }}
                  </span>
                </td>
                <td class="text-right">
                  <button (click)="openAdjust(p)" class="btn btn-brand btn-xs font-bold">Adjust Stock</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Adjustment Modal -->
      <div class="modal-backdrop" *ngIf="adjustModalOpen()" (click)="adjustModalOpen.set(false)">
        <div class="modal-dialog max-w-lg p-0" (click)="$event.stopPropagation()">
          <div class="p-5 border-b flex-between bg-slate-50">
            <div>
              <h2 class="text-base font-extrabold text-slate-900">
                Adjust Stock: {{ targetProduct()?.name }}
              </h2>
              <span class="text-xs text-muted">Current Stock: {{ targetProduct()?.stock_quantity }} units</span>
            </div>
            <button (click)="adjustModalOpen.set(false)" class="modal-close-btn" title="Close modal">&times;</button>
          </div>

          <form (submit)="saveAdjustment($event)">
            <div class="p-6">
              <div class="form-group mb-3">
                <label class="form-label">Adjustment Type</label>
                <select [(ngModel)]="adjType" name="type" class="form-control font-medium">
                  <option value="restock">Restock (Received shipment)</option>
                  <option value="adjustment">Manual Adjustment</option>
                  <option value="return">Customer Return</option>
                  <option value="sale">Manual Sale Deduction</option>
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Quantity Change (+ to add, - to subtract) *</label>
                <input type="number" [(ngModel)]="changeQty" name="changeQty" required class="form-control font-mono" />
              </div>

              <div class="form-group mb-2">
                <label class="form-label">Internal Notes / Reason</label>
                <input type="text" [(ngModel)]="adjNotes" name="notes" class="form-control" placeholder="e.g. Warehouse shipment receipt" />
              </div>
            </div>

            <div class="p-4 bg-slate-50 border-t flex-between">
              <button type="button" (click)="adjustModalOpen.set(false)" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" [disabled]="savingAdj()" class="btn btn-brand btn-sm">
                {{ savingAdj() ? 'Saving...' : 'Confirm Stock Adjustment' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .max-w-lg { max-width: 32rem; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
    .border-t { border-top: 1px solid #e2e8f0; }
    .grid-cols-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
    .text-right { text-align: right; }
    @media (max-width: 900px) {
      .grid-cols-3 { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminInventoryComponent implements OnInit {
  private adminService = inject(AdminService);

  products = signal<Product[]>([]);
  lowStockAlerts = signal<Product[]>([]);

  adjustModalOpen = signal(false);
  targetProduct = signal<Product | null>(null);
  changeQty = 10;
  adjType = 'restock';
  adjNotes = '';
  savingAdj = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.adminService.getProducts({ limit: 50 }).subscribe((res) => {
      if (res.success) this.products.set(res.data);
    });

    this.adminService.getLowStockAlerts().subscribe((res) => {
      if (res.success) this.lowStockAlerts.set(res.data);
    });
  }

  openAdjust(p: Product): void {
    this.targetProduct.set(p);
    this.changeQty = 10;
    this.adjType = 'restock';
    this.adjNotes = 'Restock arrival';
    this.adjustModalOpen.set(true);
  }

  saveAdjustment(e: Event): void {
    e.preventDefault();
    const p = this.targetProduct();
    if (!p) return;

    this.savingAdj.set(true);
    this.adminService.adjustStock(p.id, this.changeQty, this.adjType, this.adjNotes).subscribe({
      next: () => {
        this.savingAdj.set(false);
        this.adjustModalOpen.set(false);
        this.refresh();
      },
      error: () => this.savingAdj.set(false),
    });
  }
}
