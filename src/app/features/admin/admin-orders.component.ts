import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { Order } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-orders-page">
      <!-- Page Header -->
      <div class="page-header flex-between mb-6 flex-wrap gap-4">
        <div>
          <h1 class="page-title text-2xl font-extrabold text-slate-900">Orders &amp; Fulfillment</h1>
          <p class="text-xs text-muted mt-1">Review orders, manage fulfillment pipelines, and update carrier tracking details.</p>
        </div>

        <div class="header-actions flex items-center gap-3 flex-wrap">
          <div class="search-wrap">
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search order #, customer, tracking..."
              class="form-control text-xs order-search-input"
            />
          </div>

          <button (click)="fetchOrders()" class="btn btn-secondary btn-sm" title="Refresh orders list">
            <span>⟳</span> Refresh
          </button>
        </div>
      </div>

      <!-- Quick KPI Metric Cards -->
      <div class="kpi-ribbon-grid mb-6">
        <div class="kpi-mini-card" (click)="filterStatus('')" [class.selected]="!statusFilter">
          <div class="kpi-mini-icon bg-amber-50 text-amber-700">📦</div>
          <div>
            <span class="kpi-mini-label">ALL ORDERS</span>
            <strong class="kpi-mini-val">{{ totalOrdersCount() }}</strong>
          </div>
        </div>

        <div class="kpi-mini-card" (click)="filterStatus('pending')" [class.selected]="statusFilter === 'pending'">
          <div class="kpi-mini-icon bg-amber-50 text-amber-600">⏳</div>
          <div>
            <span class="kpi-mini-label">PENDING</span>
            <strong class="kpi-mini-val text-amber-600">{{ pendingCount() }}</strong>
          </div>
        </div>

        <div class="kpi-mini-card" (click)="filterStatus('processing')" [class.selected]="statusFilter === 'processing'">
          <div class="kpi-mini-icon bg-blue-50 text-blue-600">⚙️</div>
          <div>
            <span class="kpi-mini-label">PROCESSING</span>
            <strong class="kpi-mini-val text-blue-600">{{ processingCount() }}</strong>
          </div>
        </div>

        <div class="kpi-mini-card" (click)="filterStatus('shipped')" [class.selected]="statusFilter === 'shipped'">
          <div class="kpi-mini-icon bg-purple-50 text-purple-600">🚚</div>
          <div>
            <span class="kpi-mini-label">IN TRANSIT</span>
            <strong class="kpi-mini-val text-purple-600">{{ shippedCount() }}</strong>
          </div>
        </div>

        <div class="kpi-mini-card" (click)="filterStatus('delivered')" [class.selected]="statusFilter === 'delivered'">
          <div class="kpi-mini-icon bg-emerald-50 text-emerald-600">✅</div>
          <div>
            <span class="kpi-mini-label">DELIVERED</span>
            <strong class="kpi-mini-val text-emerald-600">{{ deliveredCount() }}</strong>
          </div>
        </div>
      </div>

      <!-- Filter Tabs Bar -->
      <div class="filter-tabs-wrapper mb-5 flex-between flex-wrap gap-3">
        <div class="filter-pills flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex-wrap">
          <button (click)="filterStatus('')" class="filter-pill-btn" [class.active]="!statusFilter">
            All <span class="pill-count">({{ totalOrdersCount() }})</span>
          </button>
          <button (click)="filterStatus('pending')" class="filter-pill-btn" [class.active]="statusFilter === 'pending'">
            ⏳ Pending <span class="pill-count">({{ pendingCount() }})</span>
          </button>
          <button (click)="filterStatus('processing')" class="filter-pill-btn" [class.active]="statusFilter === 'processing'">
            ⚙️ Processing <span class="pill-count">({{ processingCount() }})</span>
          </button>
          <button (click)="filterStatus('shipped')" class="filter-pill-btn" [class.active]="statusFilter === 'shipped'">
            🚚 Shipped <span class="pill-count">({{ shippedCount() }})</span>
          </button>
          <button (click)="filterStatus('delivered')" class="filter-pill-btn" [class.active]="statusFilter === 'delivered'">
            ✅ Delivered <span class="pill-count">({{ deliveredCount() }})</span>
          </button>
          <button (click)="filterStatus('cancelled')" class="filter-pill-btn" [class.active]="statusFilter === 'cancelled'">
            ❌ Cancelled <span class="pill-count">({{ cancelledCount() }})</span>
          </button>
        </div>

        <div class="text-xs text-muted font-medium">
          Showing <strong>{{ filteredOrders().length }}</strong> of {{ orders().length }} order(s)
        </div>
      </div>

      <!-- Status Update Alert Banner -->
      <div *ngIf="statusAlert()" class="admin-alert-success mb-5">
        <div class="flex items-center gap-2">
          <span class="text-base">✅</span>
          <span class="text-xs font-bold">{{ statusAlert() }}</span>
        </div>
        <button (click)="statusAlert.set(null)" class="modal-close-btn" title="Dismiss">&times;</button>
      </div>

      <!-- Orders Table Card -->
      <div class="card p-0 overflow-hidden shadow-sm orders-table-card">
        <div class="card-header-bar flex-between bg-white border-b">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 text-sm">Customer Orders Register</span>
            <span class="badge badge-slate text-xs">{{ filteredOrders().length }} Records</span>
          </div>
          <span class="text-xs text-muted">Auto-refreshes every 8 seconds</span>
        </div>

        <div class="table-responsive">
          <table class="table orders-table">
            <thead>
              <tr>
                <th style="width: 150px;">Order ID &amp; Date</th>
                <th style="width: 220px;">Customer / Recipient</th>
                <th style="width: 170px;">Ordered Items</th>
                <th style="width: 130px;">Amount Paid</th>
                <th style="width: 110px; text-align: center;">Payment</th>
                <th style="width: 150px; text-align: center;">Fulfillment Status</th>
                <th style="width: 150px;">Carrier Tracking</th>
                <th style="width: 180px; text-align: right;">Action Controls</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading() && orders().length === 0">
                <td colspan="8" class="text-center py-12 text-muted text-sm">
                  <div class="spinner-inline mb-2"></div>
                  <span class="block text-xs font-semibold text-slate-500">Loading orders pipeline...</span>
                </td>
              </tr>
              <tr *ngIf="!loading() && filteredOrders().length === 0">
                <td colspan="8" class="text-center py-12 text-muted text-sm">
                  No orders found matching the filter or search query.
                </td>
              </tr>
              <tr *ngFor="let ord of filteredOrders()" class="order-row">
                <!-- Order Reference -->
                <td>
                  <div class="order-ref-cell">
                    <strong class="text-sm font-bold text-amber-700 block font-mono">{{ ord.order_number }}</strong>
                    <span class="text-xs text-muted">{{ ord.created_at | date: 'mediumDate' }}</span>
                  </div>
                </td>

                <!-- Recipient / Customer -->
                <td>
                  <div class="customer-cell">
                    <strong class="text-slate-900 text-xs font-bold block truncate max-w-xs">
                      {{ ord.shipping_address_json?.recipient_name || ord.guest_email || 'Customer' }}
                    </strong>
                    <span class="text-xs text-slate-500 block truncate max-w-xs" *ngIf="ord.guest_email">{{ ord.guest_email }}</span>
                    <span class="text-xs text-slate-400 font-medium block">
                      {{ ord.shipping_address_json?.city || 'City' }}, {{ ord.shipping_address_json?.state || 'State' }}
                    </span>
                  </div>
                </td>

                <!-- Items Purchased -->
                <td>
                  <div class="items-cell text-xs">
                    <span class="badge badge-slate font-bold mb-1 inline-block">
                      {{ (ord.items || []).length }} item(s)
                    </span>
                    <div class="text-xs text-slate-600 truncate max-w-xs" *ngIf="ord.items && ord.items.length > 0">
                      {{ ord.items[0].product_name }}<span *ngIf="ord.items.length > 1" class="text-slate-400"> +{{ ord.items.length - 1 }} more</span>
                    </div>
                  </div>
                </td>

                <!-- Amount Paid -->
                <td>
                  <div class="amount-cell">
                    <strong class="text-slate-900 text-sm font-black">₹{{ ord.total_amount | number: '1.2-2' }}</strong>
                  </div>
                </td>

                <!-- Payment Status -->
                <td style="text-align: center;">
                  <span class="badge" [class.badge-success]="ord.payment_status === 'paid'" [class.badge-danger]="ord.payment_status === 'failed'">
                    {{ ord.payment_status | uppercase }}
                  </span>
                </td>

                <!-- Fulfillment Status -->
                <td style="text-align: center;">
                  <span
                    class="badge"
                    [class.badge-success]="ord.status === 'delivered'"
                    [class.badge-gold]="ord.status === 'pending'"
                    [class.badge-info]="ord.status === 'processing'"
                    [class.badge-shipped]="ord.status === 'shipped'"
                    [class.badge-danger]="ord.status === 'cancelled'"
                  >
                    {{ ord.status | uppercase }}
                  </span>
                </td>

                <!-- Tracking Number -->
                <td>
                  <span class="tracking-pill font-mono text-xs" [class.tracking-assigned]="ord.tracking_number">
                    {{ ord.tracking_number || 'NOT ASSIGNED' }}
                  </span>
                </td>

                <!-- Action Controls -->
                <td style="text-align: right;">
                  <div class="action-buttons-cell flex gap-2 justify-end items-center">
                    <button
                      (click)="openManageModal(ord)"
                      class="btn btn-secondary btn-xs font-bold update-status-btn"
                      title="Update order status and tracking details"
                    >
                      ✏️ Update Status
                    </button>
                    <button
                      (click)="deleteOrder(ord)"
                      class="btn btn-danger btn-xs font-bold"
                      title="Permanently delete order"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Manage Order Modal (Properly Aligned & Structured) -->
      <div class="modal-backdrop" *ngIf="activeOrder()" (click)="activeOrder.set(null)">
        <div class="modal-dialog update-status-dialog p-0" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <div class="modal-header-box p-5 border-b flex-between bg-slate-50">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-base font-black text-slate-900">Update Order Fulfillment Status</span>
                <span class="badge badge-gold font-mono text-xs">{{ activeOrder()?.order_number }}</span>
              </div>
              <span class="text-xs text-muted mt-1 block">
                Placed on {{ activeOrder()?.created_at | date: 'fullDate' }}
              </span>
            </div>
            <button (click)="activeOrder.set(null)" class="modal-close-btn" title="Close dialog">&times;</button>
          </div>

          <!-- Modal Body Form -->
          <form (submit)="saveOrderStatus($event)">
            <div class="modal-body-scroll p-6">
              <!-- Summary Card Banner (3 Columns Aligned) -->
              <div class="summary-banner-grid mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div class="summary-col">
                  <span class="summary-col-label">CUSTOMER DETAILS</span>
                  <strong class="summary-col-value text-slate-900">
                    {{ activeOrder()?.shipping_address_json?.recipient_name || activeOrder()?.guest_email || 'Customer' }}
                  </strong>
                  <span class="summary-col-sub">{{ activeOrder()?.guest_email }}</span>
                </div>

                <div class="summary-col">
                  <span class="summary-col-label">ORDER TOTAL</span>
                  <strong class="summary-col-value text-amber-700">
                    ₹{{ activeOrder()?.total_amount | number: '1.2-2' }}
                  </strong>
                  <span class="summary-col-sub">
                    <span class="badge badge-success text-xs">{{ activeOrder()?.payment_status | uppercase }}</span>
                  </span>
                </div>

                <div class="summary-col">
                  <span class="summary-col-label">CURRENT STATUS</span>
                  <strong class="summary-col-value text-slate-900 uppercase">
                    {{ activeOrder()?.status }}
                  </strong>
                  <span class="summary-col-sub">Tracking: {{ activeOrder()?.tracking_number || 'Not Set' }}</span>
                </div>
              </div>

              <!-- SECTION 1: VISUAL STATUS PICKER (Spacious, Clear & Beautiful) -->
              <div class="form-section mb-6">
                <div class="flex-between items-center mb-2">
                  <label class="form-section-title font-bold text-xs text-slate-700 tracking-wider">
                    STEP 1: SELECT FULFILLMENT STATUS *
                  </label>
                  <span class="text-xs font-bold text-amber-700 uppercase">
                    Selected: {{ newStatus }}
                  </span>
                </div>

                <div class="status-cards-grid">
                  <!-- Pending Card -->
                  <div
                    class="status-choice-card status-pending"
                    [class.selected]="newStatus === 'pending'"
                    (click)="newStatus = 'pending'"
                  >
                    <div class="status-choice-icon">⏳</div>
                    <div class="status-choice-meta">
                      <strong class="status-choice-title">Pending</strong>
                      <span class="status-choice-desc">Awaiting dispatch</span>
                    </div>
                    <div class="status-radio-dot" [class.active]="newStatus === 'pending'"></div>
                  </div>

                  <!-- Processing Card -->
                  <div
                    class="status-choice-card status-processing"
                    [class.selected]="newStatus === 'processing'"
                    (click)="newStatus = 'processing'"
                  >
                    <div class="status-choice-icon">⚙️</div>
                    <div class="status-choice-meta">
                      <strong class="status-choice-title">Processing</strong>
                      <span class="status-choice-desc">Packaging order</span>
                    </div>
                    <div class="status-radio-dot" [class.active]="newStatus === 'processing'"></div>
                  </div>

                  <!-- Shipped Card -->
                  <div
                    class="status-choice-card status-shipped"
                    [class.selected]="newStatus === 'shipped'"
                    (click)="newStatus = 'shipped'"
                  >
                    <div class="status-choice-icon">🚚</div>
                    <div class="status-choice-meta">
                      <strong class="status-choice-title">Shipped</strong>
                      <span class="status-choice-desc">In courier transit</span>
                    </div>
                    <div class="status-radio-dot" [class.active]="newStatus === 'shipped'"></div>
                  </div>

                  <!-- Delivered Card -->
                  <div
                    class="status-choice-card status-delivered"
                    [class.selected]="newStatus === 'delivered'"
                    (click)="newStatus = 'delivered'"
                  >
                    <div class="status-choice-icon">✅</div>
                    <div class="status-choice-meta">
                      <strong class="status-choice-title">Delivered</strong>
                      <span class="status-choice-desc">Completed order</span>
                    </div>
                    <div class="status-radio-dot" [class.active]="newStatus === 'delivered'"></div>
                  </div>

                  <!-- Cancelled Card -->
                  <div
                    class="status-choice-card status-cancelled"
                    [class.selected]="newStatus === 'cancelled'"
                    (click)="newStatus = 'cancelled'"
                  >
                    <div class="status-choice-icon">❌</div>
                    <div class="status-choice-meta">
                      <strong class="status-choice-title">Cancelled</strong>
                      <span class="status-choice-desc">Order voided</span>
                    </div>
                    <div class="status-radio-dot" [class.active]="newStatus === 'cancelled'"></div>
                  </div>
                </div>
              </div>

              <!-- SECTION 2: TRACKING & CARRIER INPUTS (2 Balanced Columns) -->
              <div class="form-section mb-6">
                <label class="form-section-title block mb-2 font-bold text-xs text-slate-700 tracking-wider">
                  STEP 2: DISPATCH &amp; CARRIER TRACKING DETAILS
                </label>

                <div class="grid grid-cols-2 gap-4 mb-3">
                  <div class="form-group mb-0">
                    <label class="form-label text-xs font-bold text-slate-700">Fulfillment Status Dropdown</label>
                    <select [(ngModel)]="newStatus" name="status" class="form-control font-medium">
                      <option value="pending">⏳ Pending (Awaiting dispatch)</option>
                      <option value="processing">⚙️ Processing (Packaging in progress)</option>
                      <option value="shipped">🚚 Shipped (In transit with courier)</option>
                      <option value="delivered">✅ Delivered (Completed delivery)</option>
                      <option value="cancelled">❌ Cancelled (Order voided)</option>
                    </select>
                  </div>

                  <div class="form-group mb-0">
                    <label class="form-label text-xs font-bold text-slate-700">Carrier Tracking / AWB Reference</label>
                    <input
                      type="text"
                      [(ngModel)]="newTracking"
                      name="tracking"
                      class="form-control font-mono"
                      placeholder="e.g. TRK-BLUEDART-891230"
                    />
                  </div>
                </div>

                <div class="form-group mb-0">
                  <label class="form-label text-xs font-bold text-slate-700">Courier Partner / Dispatch Notes</label>
                  <input
                    type="text"
                    [(ngModel)]="statusComment"
                    name="comments"
                    class="form-control"
                    placeholder="e.g. Dispatched via Blue Dart Express, expected delivery within 3 days"
                  />
                </div>
              </div>

              <!-- SECTION 3: PURCHASED ORDER LINE ITEMS -->
              <div class="form-section">
                <label class="form-section-title block mb-2 font-bold text-xs text-slate-700 tracking-wider">
                  ORDERED LINE ITEMS ({{ (activeOrder()?.items || []).length }})
                </label>

                <div class="order-items-box bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div *ngFor="let it of activeOrder()?.items" class="flex-between py-2 border-b border-slate-200 last:border-none">
                    <div class="flex items-center gap-2.5">
                      <span class="item-qty-badge">{{ it.quantity }}x</span>
                      <div>
                        <strong class="text-xs text-slate-900 block font-bold">{{ it.product_name }}</strong>
                        <span class="text-xs text-slate-500 font-mono" *ngIf="it.sku">SKU: {{ it.sku }}</span>
                      </div>
                    </div>
                    <strong class="text-xs font-bold text-slate-900">
                      ₹{{ it.line_total || (it.unit_price * it.quantity) | number:'1.2-2' }}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer (Clean Left & Right Alignment) -->
            <div class="p-4 bg-slate-50 border-t flex-between">
              <button type="button" (click)="deleteOrder(activeOrder()!)" class="btn btn-danger btn-sm font-bold">
                🗑️ Delete Order
              </button>

              <div class="flex gap-2">
                <button type="button" (click)="activeOrder.set(null)" class="btn btn-secondary btn-sm font-bold">
                  Cancel
                </button>
                <button type="submit" [disabled]="saving()" class="btn btn-brand btn-sm font-bold px-5">
                  {{ saving() ? 'Applying Update...' : '✓ Save Status Update' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-search-input {
      width: 280px;
    }

    /* KPI Ribbon */
    .kpi-ribbon-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.85rem;
    }

    .kpi-mini-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .kpi-mini-card:hover {
      border-color: #cbd5e1;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .kpi-mini-card.selected {
      border-color: #d97706;
      background: #fffbeb;
      box-shadow: 0 0 0 1.5px #d97706;
    }

    .kpi-mini-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      flex-shrink: 0;
    }

    .kpi-mini-label {
      display: block;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 0.15rem;
    }

    .kpi-mini-val {
      font-size: 1.15rem;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
    }

    /* Filter Tabs Bar */
    .filter-tabs-wrapper {
      align-items: center;
    }

    .filter-pill-btn {
      padding: 0.45rem 0.95rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: 8px;
      color: #64748b;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .filter-pill-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
    }

    .filter-pill-btn.active {
      background: #d97706;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(217, 119, 6, 0.25);
    }

    .filter-pill-btn.active .pill-count {
      color: #fef3c7;
    }

    .pill-count {
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
    }

    /* Orders Table Styling & Strict Column Alignment */
    .orders-table {
      min-width: 1080px;
    }

    .orders-table th {
      padding: 0.85rem 1rem !important;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .orders-table td {
      padding: 0.85rem 1rem !important;
      vertical-align: middle !important;
    }

    .order-row:hover td {
      background: #f8fafc;
    }

    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .max-w-xs {
      max-width: 220px;
    }

    .tracking-pill {
      background: #f1f5f9;
      color: #64748b;
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      display: inline-block;
      font-size: 0.75rem;
    }

    .tracking-assigned {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
      font-weight: 600;
    }

    .badge-shipped {
      background: #ede9fe;
      color: #6d28d9;
      border: 1px solid #ddd6fe;
    }

    .update-status-btn {
      white-space: nowrap;
    }

    .update-status-btn:hover {
      border-color: #d97706 !important;
      color: #d97706 !important;
    }

    /* Update Status Dialog Box */
    .update-status-dialog {
      max-width: 700px;
      width: 95%;
    }

    .summary-banner-grid {
      display: grid;
      grid-template-columns: 1.4fr 1.2fr 1.2fr;
      gap: 1rem;
    }

    .summary-col {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .summary-col-label {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #64748b;
    }

    .summary-col-value {
      font-size: 0.875rem;
      line-height: 1.3;
    }

    .summary-col-sub {
      font-size: 0.75rem;
      color: #64748b;
    }

    .form-section-title {
      font-size: 0.725rem;
      letter-spacing: 0.05em;
    }

    /* 5 Status Cards Grid */
    .status-cards-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.65rem;
    }

    .status-choice-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.85rem 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      position: relative;
      transition: all 0.15s ease;
      user-select: none;
    }

    .status-choice-card:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
      transform: translateY(-1px);
    }

    /* Card Themes */
    .status-pending.selected {
      border-color: #f59e0b;
      background: #fffbeb;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
    }
    .status-pending .status-radio-dot.active {
      border-color: #f59e0b;
      background: #f59e0b;
    }

    .status-processing.selected {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .status-processing .status-radio-dot.active {
      border-color: #3b82f6;
      background: #3b82f6;
    }

    .status-shipped.selected {
      border-color: #8b5cf6;
      background: #f5f3ff;
      box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
    }
    .status-shipped .status-radio-dot.active {
      border-color: #8b5cf6;
      background: #8b5cf6;
    }

    .status-delivered.selected {
      border-color: #10b981;
      background: #ecfdf5;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    .status-delivered .status-radio-dot.active {
      border-color: #10b981;
      background: #10b981;
    }

    .status-cancelled.selected {
      border-color: #ef4444;
      background: #fef2f2;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
    .status-cancelled .status-radio-dot.active {
      border-color: #ef4444;
      background: #ef4444;
    }

    .status-choice-icon {
      font-size: 1.4rem;
      margin-bottom: 0.35rem;
    }

    .status-choice-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: #0f172a;
      display: block;
      margin-bottom: 0.15rem;
    }

    .status-choice-desc {
      font-size: 0.65rem;
      color: #64748b;
      line-height: 1.2;
    }

    .status-radio-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1.5px solid #cbd5e1;
      margin-top: 0.5rem;
      transition: all 0.15s;
    }

    .grid-cols-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .item-qty-badge {
      background: #e2e8f0;
      color: #334155;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.45rem;
      border-radius: 6px;
    }

    @media (max-width: 900px) {
      .kpi-ribbon-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .status-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .summary-banner-grid {
        grid-template-columns: 1fr;
      }
      .grid-cols-2 {
        grid-template-columns: 1fr;
      }
      .order-search-input {
        width: 100%;
      }
    }

    @media (max-width: 640px) {
      .kpi-ribbon-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      .filter-tabs-wrapper {
        flex-direction: column;
        align-items: flex-start;
      }
      .filter-pills {
        width: 100%;
        overflow-x: auto;
        flex-wrap: nowrap;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 0.25rem;
      }
      .filter-pill-btn {
        white-space: nowrap;
        padding: 0.35rem 0.65rem;
        font-size: 0.75rem;
      }
      .header-actions {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }
      .search-wrap {
        width: 100%;
      }
      .status-cards-grid {
        grid-template-columns: 1fr;
      }
      .update-status-dialog {
        width: 98%;
        max-height: 94vh;
        overflow-y: auto;
      }
    }
  `],
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);

  orders = signal<Order[]>([]);
  loading = signal(false);
  statusFilter = '';
  searchQuery = signal('');

  activeOrder = signal<Order | null>(null);
  newStatus = 'processing';
  newTracking = '';
  statusComment = '';
  saving = signal(false);
  statusAlert = signal<string | null>(null);

  private refreshInterval: any;

  // KPI Metrics computed from orders signal
  totalOrdersCount = computed(() => this.orders().length);
  pendingCount = computed(() => this.orders().filter((o) => o.status === 'pending').length);
  processingCount = computed(() => this.orders().filter((o) => o.status === 'processing').length);
  shippedCount = computed(() => this.orders().filter((o) => o.status === 'shipped').length);
  deliveredCount = computed(() => this.orders().filter((o) => o.status === 'delivered').length);
  cancelledCount = computed(() => this.orders().filter((o) => o.status === 'cancelled').length);

  // Filtered orders responding to status filter + search query
  filteredOrders = computed(() => {
    const list = this.orders();
    const filter = this.statusFilter;
    const query = this.searchQuery().trim().toLowerCase();

    return list.filter((ord) => {
      // 1. Status Filter
      if (filter && ord.status !== filter) {
        return false;
      }

      // 2. Search Query Filter
      if (query) {
        const num = (ord.order_number || '').toLowerCase();
        const guest = (ord.guest_email || '').toLowerCase();
        const name = (ord.shipping_address_json?.recipient_name || '').toLowerCase();
        const city = (ord.shipping_address_json?.city || '').toLowerCase();
        const trk = (ord.tracking_number || '').toLowerCase();
        const status = (ord.status || '').toLowerCase();

        const matches =
          num.includes(query) ||
          guest.includes(query) ||
          name.includes(query) ||
          city.includes(query) ||
          trk.includes(query) ||
          status.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.fetchOrders();
    // Smart auto-poll: only when browser tab is active/visible
    this.refreshInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        this.fetchOrders(false);
      }
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  fetchOrders(forceRefresh = true): void {
    if (this.orders().length === 0) {
      this.loading.set(true);
    }
    // Fetch all orders without server filter so KPI counts remain accurate
    this.adminService.getOrders({ limit: 100 }, forceRefresh).subscribe({
      next: (res) => {
        if (res.success) this.orders.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  filterStatus(st: string): void {
    this.statusFilter = st;
  }

  openManageModal(ord: Order): void {
    this.activeOrder.set(ord);
    this.newStatus = ord.status;
    this.newTracking = ord.tracking_number || '';
    this.statusComment = '';
  }

  saveOrderStatus(e: Event): void {
    e.preventDefault();
    const ord = this.activeOrder();
    if (!ord) return;

    this.saving.set(true);
    this.adminService
      .updateOrderStatus(ord.id, this.newStatus, undefined, this.newTracking, this.statusComment)
      .subscribe({
        next: () => {
          this.saving.set(false);
          const updatedNum = ord.order_number;
          const updatedSt = this.newStatus;
          this.activeOrder.set(null);
          this.statusAlert.set(`Order ${updatedNum} fulfillment status updated to "${updatedSt.toUpperCase()}".`);
          setTimeout(() => this.statusAlert.set(null), 5000);
          this.fetchOrders();
        },
        error: () => this.saving.set(false),
      });
  }

  deleteOrder(ord: Order): void {
    if (!ord) return;
    if (confirm(`Are you sure you want to permanently delete order ${ord.order_number}? This cannot be undone.`)) {
      this.adminService.deleteOrder(ord.id).subscribe({
        next: () => {
          this.activeOrder.set(null);
          this.statusAlert.set(`Order ${ord.order_number} has been permanently deleted.`);
          setTimeout(() => this.statusAlert.set(null), 5000);
          this.fetchOrders();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete order');
        },
      });
    }
  }
}
