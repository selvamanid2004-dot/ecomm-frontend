import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { ExportService } from '../../core/services/export.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-customers-page">
      <!-- Page Header -->
      <div class="page-header flex-between mb-6 flex-wrap gap-4">
        <div>
          <h1 class="page-title text-2xl font-extrabold text-slate-900">Customer Accounts</h1>
          <p class="text-xs text-muted mt-1">Review patron profiles, customer engagement, loyalty points, and lifetime spend history.</p>
        </div>

        <div class="header-actions flex items-center gap-2 flex-wrap">
          <div class="search-wrap">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              placeholder="Search customer name or email..."
              class="form-control text-xs w-64"
            />
          </div>

          <button (click)="initiateExport('pdf')" [disabled]="exporting()" class="btn btn-secondary btn-sm font-bold flex items-center gap-1.5" title="Export customers directory as PDF">
            <span>📄</span> Export PDF
          </button>
          <button (click)="initiateExport('csv')" [disabled]="exporting()" class="btn btn-secondary btn-sm font-bold flex items-center gap-1.5" title="Export customers directory as CSV">
            <span>📑</span> Export CSV
          </button>
          <button (click)="initiateExport('excel')" [disabled]="exporting()" class="btn btn-secondary btn-sm font-bold flex items-center gap-1.5" title="Export customers directory as Excel">
            <span>📊</span> Export Excel
          </button>

          <button (click)="fetchCustomers()" class="btn btn-secondary btn-sm" title="Refresh customers">
            <span>⟳</span> Refresh
          </button>
        </div>
      </div>

      <!-- Customers Table Card -->
      <div class="card p-0 overflow-hidden shadow-sm">
        <div class="card-header-bar flex-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 text-sm">Customer Directory</span>
            <span class="badge badge-slate text-xs">{{ customers().length }} Registered</span>
          </div>
          <span class="text-xs text-muted">Direct database patron records</span>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Loyalty Tier</th>
                <th>Total Orders</th>
                <th>Lifetime Spend</th>
                <th>Registration Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="customers().length === 0">
                <td colspan="7" class="text-center py-10 text-muted text-sm">
                  No customer accounts matching your search query.
                </td>
              </tr>
              <tr *ngFor="let c of customers()">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="customer-avatar">
                      {{ (c.name || c.email || 'C').charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <strong class="text-sm font-bold text-slate-900 block">{{ c.name || 'Customer' }}</strong>
                      <span class="text-xs text-muted">{{ c.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="text-xs font-mono text-slate-700">{{ c.phone || '—' }}</td>
                <td>
                  <span class="badge badge-gold">{{ c.loyaltyPoints }} pts</span>
                </td>
                <td>
                  <span class="font-bold text-slate-800 text-sm">{{ c.totalOrders }}</span>
                </td>
                <td>
                  <strong class="font-bold text-amber-700 text-sm">₹{{ c.totalSpend | number: '1.2-2' }}</strong>
                </td>
                <td class="text-xs text-muted">{{ c.createdAt | date: 'mediumDate' }}</td>
                <td class="text-right">
                  <button (click)="deleteCustomer(c)" class="btn btn-danger btn-xs font-bold" title="Delete customer account">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Export Scope Selection Modal -->
      <div class="modal-backdrop" *ngIf="exportModalOpen()" (click)="exportModalOpen.set(false)">
        <div class="modal-dialog max-w-md p-0 overflow-hidden" (click)="$event.stopPropagation()">
          <div class="p-5 border-b flex-between bg-slate-50">
            <div>
              <h2 class="text-base font-extrabold text-slate-900">Export Customer Accounts</h2>
              <span class="text-xs text-muted mt-0.5 block">Format: {{ exportTargetFormat().toUpperCase() }}</span>
            </div>
            <button (click)="exportModalOpen.set(false)" class="modal-close-btn">&times;</button>
          </div>

          <div class="p-5">
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-xs text-amber-900">
              <strong>Active Filter Applied:</strong>
              <div class="mt-1">Search: "<span class="font-bold">{{ searchQuery }}</span>"</div>
            </div>

            <p class="text-xs text-slate-600 mb-4">
              Choose whether to export only the patrons matching your search query or all registered customer accounts:
            </p>

            <div class="flex flex-col gap-2.5">
              <button
                type="button"
                (click)="confirmExport('filtered')"
                class="btn btn-secondary text-xs font-bold py-3 px-4 flex items-center justify-between text-left"
              >
                <div>
                  <div class="text-slate-900 font-extrabold">Export Filtered Results</div>
                  <div class="text-[11px] text-muted">Patrons matching "{{ searchQuery }}"</div>
                </div>
                <span class="badge badge-amber text-xs font-bold">{{ customers().length }} Patrons</span>
              </button>

              <button
                type="button"
                (click)="confirmExport('all')"
                class="btn btn-primary text-xs font-bold py-3 px-4 flex items-center justify-between text-left"
              >
                <div>
                  <div class="text-white font-extrabold">Export All Customer Accounts</div>
                  <div class="text-slate-300 text-[11px]">Complete registered database patrons</div>
                </div>
                <span class="badge badge-slate text-xs font-bold">All Registered</span>
              </button>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t flex justify-end">
            <button type="button" (click)="exportModalOpen.set(false)" class="btn btn-secondary btn-sm font-bold">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .w-72 { width: 18rem; }
    .text-right { text-align: right; }
    .customer-avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: #e2e8f0;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
  `],
})
export class AdminCustomersComponent implements OnInit {
  private adminService = inject(AdminService);
  private exportService = inject(ExportService);

  customers = signal<any[]>([]);
  exporting = signal(false);
  exportModalOpen = signal(false);
  exportTargetFormat = signal<'pdf' | 'csv' | 'excel'>('pdf');
  searchQuery = '';

  ngOnInit(): void {
    try {
      const cached = sessionStorage.getItem('luxe_admin_cached_customers');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) this.customers.set(parsed);
      }
    } catch {}
    this.fetchCustomers();
  }

  fetchCustomers(): void {
    this.adminService.getCustomers({ search: this.searchQuery || undefined }).subscribe((res) => {
      if (res.success) {
        this.customers.set(res.data);
        if (!this.searchQuery) {
          try {
            sessionStorage.setItem('luxe_admin_cached_customers', JSON.stringify(res.data));
          } catch {}
        }
      }
    });
  }

  onSearch(): void {
    this.fetchCustomers();
  }

  initiateExport(format: 'pdf' | 'csv' | 'excel'): void {
    if (this.searchQuery && this.searchQuery.trim()) {
      this.exportTargetFormat.set(format);
      this.exportModalOpen.set(true);
    } else {
      this.executeCustomersExport(format, 'all');
    }
  }

  confirmExport(scope: 'filtered' | 'all'): void {
    const fmt = this.exportTargetFormat();
    this.exportModalOpen.set(false);
    this.executeCustomersExport(fmt, scope);
  }

  executeCustomersExport(format: 'pdf' | 'csv' | 'excel', scope: 'filtered' | 'all'): void {
    this.exporting.set(true);
    const params: any = { all: 'true' };
    if (scope === 'filtered' && this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }

    this.adminService.getCustomers(params, true).subscribe({
      next: (res) => {
        this.exporting.set(false);
        const list = res.success ? (res.data || []) : (scope === 'filtered' ? this.customers() : []);
        if (list.length === 0) {
          alert('No customer records found matching the export criteria.');
          return;
        }

        const timestamp = Date.now();
        const scopeLabel = scope === 'filtered' ? 'Filtered' : 'Full';

        if (format === 'pdf') {
          const headers = [
            'Customer ID',
            'Customer Name',
            'Email Address',
            'Phone',
            'Loyalty Tier',
            'Orders',
            'Lifetime Spend (₹)',
            'Registration Date',
          ];
          const rows = list.map((c: any) => [
            c.id || c.userId || '—',
            c.name || 'Customer',
            c.email || '—',
            c.phone || '—',
            `${c.loyaltyPoints || 0} pts`,
            String(c.totalOrders || 0),
            `₹ ${Number(c.totalSpend || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—',
          ]);

          this.exportService.exportTableToPdf({
            filename: `Customers_${scopeLabel}_Export_${timestamp}`,
            title: `Customer Accounts Directory (${scopeLabel} Database)`,
            subtitle: `Total Customers: ${list.length} | Generated: ${new Date().toLocaleString('en-IN')}`,
            headers,
            rows,
            orientation: 'l',
          });
        } else if (format === 'csv') {
          const headers = [
            'Customer ID',
            'Full Name',
            'Email Address',
            'Phone Number',
            'Loyalty Points',
            'Total Orders',
            'Lifetime Spend (₹)',
            'Registration Date',
          ];
          const rows = list.map((c: any) => [
            c.id || c.userId || '',
            c.name || 'Customer',
            c.email || '',
            c.phone || '',
            Number(c.loyaltyPoints || 0),
            Number(c.totalOrders || 0),
            `₹ ${Number(c.totalSpend || 0).toFixed(2)}`,
            c.createdAt ? new Date(c.createdAt).toISOString() : '',
          ]);

          this.exportService.exportTableToCsv({
            filename: `Customers_${scopeLabel}_Export_${timestamp}`,
            headers,
            rows,
          });
        } else if (format === 'excel') {
          const headers = [
            'Customer ID',
            'Full Name',
            'Email Address',
            'Phone Number',
            'Loyalty Points',
            'Total Orders',
            'Lifetime Spend (₹)',
            'Registration Date',
          ];
          const rows = list.map((c: any) => [
            c.id || c.userId || '',
            c.name || 'Customer',
            c.email || '',
            c.phone || '',
            Number(c.loyaltyPoints || 0),
            Number(c.totalOrders || 0),
            Number(c.totalSpend || 0),
            c.createdAt ? new Date(c.createdAt).toISOString() : '',
          ]);

          this.exportService.exportTableToExcel({
            filename: `Customers_${scopeLabel}_Export_${timestamp}`,
            sheetName: 'Customers',
            title: `Master Customer Accounts Directory (${scopeLabel} Database)`,
            headers,
            rows,
          });
        }
      },
      error: () => {
        this.exporting.set(false);
        alert('Failed to retrieve full customer directory for export.');
      },
    });
  }

  exportPdf(): void {
    this.initiateExport('pdf');
  }

  exportExcel(): void {
    this.initiateExport('excel');
  }

  deleteCustomer(c: any): void {
    const displayName = c.name || c.email || 'this customer';
    if (confirm(`Are you sure you want to permanently delete customer account "${displayName}"?`)) {
      const targetId = c.id || c.userId;
      this.adminService.deleteCustomer(targetId).subscribe({
        next: () => {
          this.fetchCustomers();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete customer');
        },
      });
    }
  }
}

