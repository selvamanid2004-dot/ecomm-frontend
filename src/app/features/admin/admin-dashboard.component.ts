import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ExportService } from '../../core/services/export.service';
import { AdminMetrics } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page" *ngIf="metrics(); else loadingTpl">
      <!-- Page Header -->
      <div class="page-header flex-between mb-6 flex-wrap gap-4">
        <div>
          <h1 class="page-title text-2xl font-extrabold text-slate-900">Executive Dashboard</h1>
          <p class="text-xs text-muted mt-1">Real-time revenue metrics, order fulfillment pipeline, and live system operations.</p>
        </div>
        <div class="header-actions flex items-center gap-2 flex-wrap">
          <button (click)="exportPdf()" class="btn btn-secondary btn-sm font-bold flex items-center gap-1.5" title="Export Dashboard Report as PDF">
            <span>📄</span> Export PDF
          </button>
          <button (click)="exportExcel()" class="btn btn-secondary btn-sm font-bold flex items-center gap-1.5" title="Export Dashboard Report as Excel">
            <span>📊</span> Export Excel
          </button>
          <button (click)="refresh()" [disabled]="refreshing()" class="btn btn-primary btn-sm font-bold">
            <span>⟳</span> {{ refreshing() ? 'Updating...' : 'Refresh Analytics' }}
          </button>
        </div>
      </div>

      <!-- KPI Metrics Grid -->
      <div class="kpi-grid mb-6">
        <div class="kpi-card card">
          <div class="kpi-header flex-between">
            <span class="kpi-label">TOTAL REVENUE</span>
            <span class="kpi-icon-pill bg-amber-50 text-amber-700">₹</span>
          </div>
          <div class="kpi-val text-slate-900">₹{{ metrics()?.overview?.totalRevenue | number: '1.2-2' }}</div>
          <div class="kpi-sub text-muted">All settled customer payments</div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-header flex-between">
            <span class="kpi-label">TOTAL ORDERS</span>
            <span class="kpi-icon-pill bg-blue-50 text-blue-600">🛍️</span>
          </div>
          <div class="kpi-val text-slate-900">{{ metrics()?.overview?.totalOrders }}</div>
          <div class="kpi-sub text-info">{{ metrics()?.overview?.pendingOrders }} pending processing</div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-header flex-between">
            <span class="kpi-label">ACTIVE CREATIONS</span>
            <span class="kpi-icon-pill bg-emerald-50 text-emerald-600">📦</span>
          </div>
          <div class="kpi-val text-slate-900">{{ metrics()?.overview?.totalProducts }}</div>
          <div class="kpi-sub text-muted">Published live on storefront</div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-header flex-between">
            <span class="kpi-label">INVENTORY ALERTS</span>
            <span class="kpi-icon-pill bg-red-50 text-red-600">⚠️</span>
          </div>
          <div class="kpi-val" [class.text-danger]="(metrics()?.overview?.lowStockProducts || 0) > 0" [class.text-slate-900]="(metrics()?.overview?.lowStockProducts || 0) === 0">
            {{ metrics()?.overview?.lowStockProducts }}
          </div>
          <div class="kpi-sub text-muted">At or below stock threshold</div>
        </div>
      </div>

      <!-- Tables Grid: Recent Orders & Price Adjustments -->
      <div class="dashboard-tables-grid">
        <!-- Recent Orders Card -->
        <div class="card p-0 overflow-hidden shadow-sm">
          <div class="card-header-bar flex-between">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Recent Customer Orders</h2>
              <span class="text-xs text-muted">Latest purchases across all accounts</span>
            </div>
            <a routerLink="/admin/orders" class="btn btn-secondary btn-xs font-bold text-slate-700 hover:text-amber-700">
              View All Orders &rarr;
            </a>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Placed Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="(metrics()?.recentOrders || []).length === 0">
                  <td colspan="5" class="text-center py-6 text-muted text-xs">
                    No orders logged yet.
                  </td>
                </tr>
                <tr *ngFor="let ord of metrics()?.recentOrders">
                  <td>
                    <a [routerLink]="['/admin/orders']" class="text-amber-700 font-bold font-mono text-xs hover:underline">
                      {{ ord.orderNumber }}
                    </a>
                  </td>
                  <td>
                    <span class="text-slate-800 font-semibold text-xs block">{{ ord.customerName }}</span>
                  </td>
                  <td>
                    <strong class="text-slate-900 text-xs font-bold">₹{{ ord.totalAmount | number: '1.2-2' }}</strong>
                  </td>
                  <td>
                    <span
                      class="badge"
                      [class.badge-success]="ord.status === 'delivered'"
                      [class.badge-gold]="ord.status === 'pending'"
                      [class.badge-info]="ord.status === 'processing' || ord.status === 'shipped'"
                      [class.badge-danger]="ord.status === 'cancelled'"
                    >
                      {{ ord.status | uppercase }}
                    </span>
                  </td>
                  <td class="text-xs text-muted">{{ ord.createdAt | date: 'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Price History Audit Card -->
        <div class="card p-0 overflow-hidden shadow-sm">
          <div class="card-header-bar flex-between">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Price Adjustments &amp; Audit Trail</h2>
              <span class="text-xs text-muted">Audited pricing movements in database</span>
            </div>
            <a routerLink="/admin/pricing" class="btn btn-secondary btn-xs font-bold text-slate-700 hover:text-amber-700">
              Price Console &rarr;
            </a>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Adjustment</th>
                  <th>Reason</th>
                  <th>Logged Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="(metrics()?.recentPriceChanges || []).length === 0">
                  <td colspan="4" class="text-center py-6 text-muted text-xs">
                    No price changes logged in audit history.
                  </td>
                </tr>
                <tr *ngFor="let price of metrics()?.recentPriceChanges">
                  <td>
                    <span class="font-bold text-slate-900 text-xs block">{{ price.productName || 'Product' }}</span>
                  </td>
                  <td>
                    <span class="text-muted line-through text-xs mr-1">₹{{ price.oldPrice }}</span>
                    <span class="text-xs font-bold text-amber-700">&rarr; ₹{{ price.newPrice }}</span>
                  </td>
                  <td class="text-xs text-slate-600">{{ price.reason }}</td>
                  <td class="text-xs text-muted">{{ price.createdAt | date: 'shortDate' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="text-center py-16">
        <div class="spinner mb-3"></div>
        <span class="text-muted text-sm font-medium">Aggregating live operational metrics...</span>
      </div>
    </ng-template>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    .kpi-card {
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .kpi-header {
      margin-bottom: 0.75rem;
    }

    .kpi-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #64748b;
    }

    .kpi-icon-pill {
      width: 2rem;
      height: 2rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      font-weight: 700;
    }

    .kpi-val {
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 0.35rem;
      letter-spacing: -0.02em;
    }

    .kpi-sub {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .dashboard-tables-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .line-through { text-decoration: line-through; }
    .mr-1 { margin-right: 0.25rem; }

    @media (max-width: 1100px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .dashboard-tables-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .page-header .btn {
        width: 100%;
      }
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private exportService = inject(ExportService);
  metrics = signal<AdminMetrics | null>(null);
  refreshing = signal<boolean>(false);

  ngOnInit(): void {
    this.refresh(false);
  }

  refresh(force = true): void {
    this.refreshing.set(true);
    this.adminService.getMetrics(force).subscribe({
      next: (res) => {
        if (res.success) this.metrics.set(res.data);
        this.refreshing.set(false);
      },
      error: () => this.refreshing.set(false),
    });
  }

  exportPdf(): void {
    const m = this.metrics();
    if (!m) return;
    const ov = m.overview || ({} as any);
    const headers = ['Category', 'Key Performance Indicator', 'Value / Details (₹)'];
    const rows = [
      ['Financial Performance', 'Total Settled Revenue', `₹ ${Number(ov.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ['Fulfillment Operations', 'Total Orders Placed', String(ov.totalOrders || 0)],
      ['Fulfillment Operations', 'Pending Orders', String(ov.pendingOrders || 0)],
      ['Catalog & Inventory', 'Active Published Creations', String(ov.totalProducts || 0)],
      ['Catalog & Inventory', 'Inventory Alerts (Low Stock)', String(ov.lowStockProducts || 0)],
      ['Customer Base', 'Registered Customer Accounts', String(ov.totalCustomers || 0)],
    ];

    if (m.recentOrders && m.recentOrders.length > 0) {
      m.recentOrders.forEach((o) => {
        rows.push([
          'Recent Orders',
          `Order #${o.orderNumber} - ${o.customerName}`,
          `₹ ${Number(o.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} [${(o.status || '').toUpperCase()}]`,
        ]);
      });
    }

    this.exportService.exportTableToPdf({
      filename: `Dashboard_Executive_Report_${Date.now()}`,
      title: 'Executive Dashboard & KPI Analytics Report',
      subtitle: 'Complete real-time revenue, order fulfillment status, and catalog overview',
      headers,
      rows,
    });
  }

  exportExcel(): void {
    const m = this.metrics();
    if (!m) return;
    const ov = m.overview || ({} as any);
    const headers = ['Category', 'Key Performance Indicator', 'Value', 'Details / Notes'];
    const rows: (string | number)[][] = [
      ['Revenue', 'Total Revenue', Number(ov.totalRevenue || 0), 'Settled and confirmed customer payments in ₹'],
      ['Orders', 'Total Orders', Number(ov.totalOrders || 0), 'All customer orders'],
      ['Orders', 'Pending Orders', Number(ov.pendingOrders || 0), 'Orders awaiting fulfillment dispatch'],
      ['Inventory', 'Active Products', Number(ov.totalProducts || 0), 'Published live products on storefront'],
      ['Inventory', 'Low Stock Alerts', Number(ov.lowStockProducts || 0), 'Creations at or below threshold'],
      ['Customers', 'Total Customers', Number(ov.totalCustomers || 0), 'Registered customer accounts'],
    ];

    if (m.recentOrders && m.recentOrders.length > 0) {
      m.recentOrders.forEach((o) => {
        rows.push([
          'Recent Order',
          o.orderNumber,
          Number(o.totalAmount || 0),
          `Customer: ${o.customerName} | Status: ${o.status} | Placed: ${new Date(o.createdAt).toLocaleDateString('en-IN')}`,
        ]);
      });
    }

    this.exportService.exportTableToExcel({
      filename: `Dashboard_Executive_Report_${Date.now()}`,
      sheetName: 'Executive KPI Report',
      title: 'Executive Dashboard & Financial Performance Report',
      headers,
      rows,
    });
  }
}

