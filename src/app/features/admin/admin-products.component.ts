import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ProductService } from '../../core/services/product.service';
import { Product, Category } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-products-page">
      <!-- Page Header -->
      <div class="page-header flex-between mb-6 flex-wrap gap-4">
        <div>
          <h1 class="page-title text-2xl font-extrabold text-slate-900">Product Catalog</h1>
          <p class="text-xs text-muted mt-1">Manage published creations, review prices, update product media, and control active status.</p>
        </div>
        <a routerLink="/admin/add-product" class="btn btn-brand btn-sm font-bold flex items-center gap-1.5 shadow-sm">
          <span>+</span> Add New Product
        </a>
      </div>

      <!-- Products Table Card -->
      <div class="card p-0 overflow-hidden shadow-sm">
        <div class="card-header-bar flex-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 text-sm">Creations Catalog</span>
            <span class="badge badge-slate text-xs">{{ products().length }} Products</span>
          </div>
          <span class="text-xs text-muted">Synced with storefront catalog</span>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Selling Price</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="products().length === 0">
                <td colspan="6" class="text-center py-10 text-muted text-sm">
                  No products in the catalog. Click "+ Add New Product" to create your first item.
                </td>
              </tr>
              <tr *ngFor="let p of products()">
                <td>
                  <div class="flex gap-3 items-center">
                    <img
                      [src]="p.images && p.images.length > 0 && p.images[0].image_url ? p.images[0].image_url : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'"
                      [alt]="p.name"
                      class="product-thumb"
                    />
                    <div>
                      <strong class="text-sm font-bold text-slate-900 block">{{ p.name }}</strong>
                      <span class="text-xs text-muted">{{ p.slug }}</span>
                    </div>
                  </div>
                </td>
                <td class="text-xs font-mono text-slate-700">{{ p.sku }}</td>
                <td>
                  <strong class="font-bold text-amber-700 text-sm">₹{{ p.base_price | number: '1.2-2' }}</strong>
                </td>
                <td>
                  <span class="badge" [class.badge-danger]="p.stock_quantity <= p.low_stock_threshold" [class.badge-success]="p.stock_quantity > p.low_stock_threshold">
                    {{ p.stock_quantity }} units
                  </span>
                </td>
                <td>
                  <span class="badge" [class.badge-success]="p.is_active" [class.badge-slate]="!p.is_active">
                    {{ p.is_active ? 'ACTIVE' : 'INACTIVE' }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="flex gap-2 justify-end">
                    <button (click)="openEditModal(p)" class="btn btn-secondary btn-xs font-bold text-slate-800 hover:text-amber-700">
                      Edit
                    </button>
                    <button
                      (click)="toggleStatus(p)"
                      [class.btn-warning]="p.is_active"
                      [class.btn-success]="!p.is_active"
                      class="btn btn-xs font-bold"
                    >
                      {{ p.is_active ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button
                      (click)="deleteProduct(p)"
                      class="btn btn-danger btn-xs font-bold"
                      title="Permanently delete product"
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

      <!-- Edit Product Modal -->
      <div class="modal-backdrop" *ngIf="modalOpen()" (click)="closeModal()">
        <div class="modal-dialog max-w-lg p-0" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <div class="p-5 border-b flex-between bg-slate-50">
            <div>
              <h2 class="text-base font-extrabold text-slate-900">Edit Product Details</h2>
              <span class="text-xs text-muted mt-0.5 block">Update name, price, description, and image</span>
            </div>
            <button (click)="closeModal()" class="modal-close-btn" title="Close modal">&times;</button>
          </div>

          <!-- Modal Form -->
          <form (submit)="saveProduct($event)">
            <div class="p-6">
              <div class="form-group mb-3">
                <label class="form-label">Product Name *</label>
                <input type="text" [(ngModel)]="formData.name" name="name" required class="form-control" />
              </div>

              <div class="form-group mb-3">
                <div class="flex-between items-center mb-1">
                  <label class="form-label mb-0">Selling Price (₹) *</label>
                  <span class="text-xs font-semibold text-slate-500">₹1 per arrow click</span>
                </div>
                <div class="price-stepper-wrap">
                  <span class="price-stepper-prefix">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    [(ngModel)]="formData.base_price"
                    name="base_price"
                    required
                    class="price-stepper-input font-mono"
                  />
                  <div class="price-stepper-controls">
                    <button
                      type="button"
                      (click)="stepPrice(1)"
                      class="price-stepper-btn btn-up"
                      title="Increase price by ₹1"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      (click)="stepPrice(-1)"
                      [disabled]="(formData.base_price || 0) <= 0"
                      class="price-stepper-btn btn-down"
                      title="Decrease price by ₹1"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Description *</label>
                <textarea [(ngModel)]="formData.description" name="description" rows="3" required class="form-control"></textarea>
              </div>

              <!-- Product Image Selection -->
              <div class="form-group mb-4">
                <label class="form-label">Product Image</label>
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <img
                    *ngIf="imagePreview"
                    [src]="imagePreview"
                    alt="Product preview"
                    class="w-14 h-14 rounded-lg object-cover border border-slate-300 shadow-sm"
                  />
                  <div class="flex-1">
                    <button
                      type="button"
                      (click)="filePicker.click()"
                      class="btn btn-secondary btn-xs font-bold"
                    >
                      📁 Select New Image File
                    </button>
                    <span class="text-xs text-slate-500 block mt-1">PNG, JPG, WEBP from your computer</span>
                    <input
                      #filePicker
                      type="file"
                      accept="image/*"
                      (change)="onModalFileSelected($event)"
                      style="display:none"
                    />
                  </div>
                </div>
              </div>

              <div class="form-group mb-2 flex items-center gap-2">
                <input type="checkbox" id="isActiveCheck" [(ngModel)]="formData.is_active" name="is_active" class="cursor-pointer" />
                <label for="isActiveCheck" class="form-label mb-0 cursor-pointer text-slate-800">
                  Visible and available on Storefront (Active)
                </label>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-4 bg-slate-50 border-t flex-between">
              <button type="button" (click)="closeModal()" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" [disabled]="saving()" class="btn btn-brand btn-sm">
                {{ saving() ? 'Saving...' : 'Update Product' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .max-w-lg { max-width: 32rem; }
    .product-thumb {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .text-right { text-align: right; }
    .justify-end { justify-content: flex-end; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
    .border-t { border-top: 1px solid #e2e8f0; }
    .cursor-pointer { cursor: pointer; }
    @media (max-width: 640px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .page-header .btn {
        width: 100%;
      }
      .modal-dialog {
        width: 95% !important;
        margin: 1rem auto;
      }
    }
  `],
})
export class AdminProductsComponent implements OnInit {
  private adminService = inject(AdminService);
  private productService = inject(ProductService);
  private router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  modalOpen = signal(false);
  isEditing = signal(false);
  editingId: string | null = null;
  saving = signal(false);

  formData: any = {};
  imageInput = '';
  imagePreview = '';
  modalFile: File | null = null;

  ngOnInit(): void {
    this.fetchData();
    this.productService.getCategories().subscribe((res) => {
      if (res.success) this.categories.set(res.data);
    });
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  fetchData(): void {
    this.adminService.getProducts({ limit: 50 }).subscribe((res) => {
      if (res.success) this.products.set(res.data);
    });
  }

  stepPrice(delta: number): void {
    const cur = Number(this.formData.base_price) || 0;
    const next = Math.max(0, cur + delta);
    this.formData.base_price = Math.round(next * 100) / 100;
  }

  openEditModal(p: Product): void {
    this.isEditing.set(true);
    this.editingId = p.id;
    this.modalFile = null;
    this.formData = {
      name: p.name,
      base_price: p.base_price,
      description: p.description,
      is_active: p.is_active,
    };
    this.imagePreview = p.images?.[0]?.image_url || '';
    this.modalOpen.set(true);
  }

  onModalFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.modalFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  saveProduct(e: Event): void {
    e.preventDefault();
    this.saving.set(true);

    if (this.modalFile) {
      this.adminService.uploadImage(this.modalFile).subscribe({
        next: (up) => {
          const finalUrl = up.data?.url || up.data?.relativeUrl;
          this.executeProductUpdate(finalUrl);
        },
        error: () => {
          this.executeProductUpdate(this.imagePreview);
        },
      });
    } else {
      this.executeProductUpdate(this.imagePreview);
    }
  }

  private executeProductUpdate(imageUrl?: string): void {
    const payload = {
      ...this.formData,
      image_urls: imageUrl ? [imageUrl] : (this.imagePreview ? [this.imagePreview] : []),
    };

    if (this.isEditing() && this.editingId) {
      this.adminService.updateProduct(this.editingId, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.fetchData();
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.adminService.createProduct(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.fetchData();
        },
        error: () => this.saving.set(false),
      });
    }
  }

  toggleStatus(p: Product): void {
    const action = p.is_active ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} "${p.name}" on the public storefront?`)) {
      this.adminService.toggleProductStatus(p.id).subscribe({
        next: () => this.fetchData(),
      });
    }
  }

  deleteProduct(p: Product): void {
    if (confirm(`Are you sure you want to permanently delete "${p.name}" (SKU: ${p.sku})? This product will be completely removed.`)) {
      this.adminService.deleteProduct(p.id).subscribe({
        next: () => this.fetchData(),
        error: (err) => alert(err.error?.message || 'Failed to delete product'),
      });
    }
  }
}
