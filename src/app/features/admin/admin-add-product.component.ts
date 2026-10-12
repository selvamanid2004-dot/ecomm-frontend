import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="add-product-container">
      <!-- Header -->
      <div class="page-header mb-6">
        <div class="flex items-center gap-3">
          <a routerLink="/admin/products" class="btn btn-secondary btn-sm font-bold" title="Back to Products">
            &larr; Back to Products
          </a>
          <div>
            <h1 class="page-title text-2xl font-extrabold text-slate-900">Add New Product</h1>
            <p class="text-xs text-muted mt-1">Fill in the 4 product details below to publish directly to the storefront catalog.</p>
          </div>
        </div>
      </div>

      <!-- Success Alert Banner -->
      <div *ngIf="successMessage()" class="admin-alert-success mb-6">
        <div class="flex items-center gap-3">
          <span class="text-xl">✓</span>
          <div>
            <strong class="text-sm font-bold block text-emerald-950">Product Successfully Published!</strong>
            <span class="text-xs text-emerald-800">{{ successMessage() }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button (click)="resetForm()" class="btn btn-secondary btn-xs font-bold">
            + Add Another
          </button>
          <a routerLink="/admin/products" class="btn btn-brand btn-xs font-bold">
            View in Catalog &rarr;
          </a>
        </div>
      </div>

      <!-- Main Form Card -->
      <div class="card p-6 sm:p-8 max-w-2xl mx-auto shadow-sm">
        <form (submit)="onSubmit($event)">
          <!-- 1. Product Name -->
          <div class="form-group mb-4">
            <label class="form-label">
              1. Product Name <span class="text-danger">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="name"
              name="name"
              required
              placeholder="e.g. Italian Leather Weekender Bag"
              class="form-control"
            />
            <span class="text-xs text-slate-500 mt-1 block">The title displayed to shoppers across catalog cards and detail views.</span>
          </div>

          <!-- 2. Price -->
          <div class="form-group mb-4">
            <div class="flex-between items-center mb-1">
              <label class="form-label mb-0">
                2. Selling Price (₹) <span class="text-danger">*</span>
              </label>
              <span class="text-xs font-semibold text-slate-500">₹1 per arrow click</span>
            </div>
            <div class="price-stepper-wrap">
              <span class="price-stepper-prefix">₹</span>
              <input
                type="number"
                step="1"
                min="0"
                [(ngModel)]="price"
                name="price"
                required
                placeholder="2499.00"
                class="price-stepper-input"
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
                  [disabled]="(price || 0) <= 0"
                  class="price-stepper-btn btn-down"
                  title="Decrease price by ₹1"
                >
                  ▼
                </button>
              </div>
            </div>
            <span class="text-xs text-slate-500 mt-1 block">Set retail price in Indian Rupees (₹). Use ▲ / ▼ controls for ₹1 adjustments or enter manually.</span>
          </div>

          <!-- 3. Description -->
          <div class="form-group mb-4">
            <label class="form-label">
              3. Description <span class="text-danger">*</span>
            </label>
            <textarea
              [(ngModel)]="description"
              name="description"
              required
              rows="4"
              placeholder="Handcrafted using full-grain Tuscan calfskin, brass hardware, and dedicated padded laptop sleeve..."
              class="form-control"
            ></textarea>
            <span class="text-xs text-slate-500 mt-1 block">Detailed specifications, craftsmanship, and materials.</span>
          </div>

          <!-- 4. Product Image Upload -->
          <div class="form-group mb-6">
            <label class="form-label">
              4. Product Image <span class="text-danger">*</span>
            </label>
            <p class="text-xs text-slate-500 mb-2">
              Select an image file directly from your computer using the file picker.
            </p>

            <!-- Drop / Browse Zone when no preview -->
            <div
              *ngIf="!imagePreview()"
              (click)="fileInput.click()"
              class="upload-dropzone p-8 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-500 cursor-pointer text-center bg-slate-50/70 transition-all"
            >
              <input
                #fileInput
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                (change)="onFileSelected($event)"
                class="hidden"
              />
              <div class="flex flex-col items-center justify-center gap-2">
                <span class="text-3xl">📁</span>
                <strong class="text-sm text-slate-800 font-bold">Choose Image File from Computer</strong>
                <span class="text-xs text-slate-500">Click to browse your files (PNG, JPG, JPEG, WEBP)</span>
              </div>
            </div>

            <!-- Image Live Preview Box -->
            <div *ngIf="imagePreview()" class="preview-card bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
              <div class="preview-img-wrap relative">
                <img
                  [src]="imagePreview()"
                  alt="Product preview"
                  class="preview-img w-28 h-28 object-cover rounded-lg border border-slate-300 shadow-sm"
                />
              </div>

              <div class="preview-meta flex-1 text-left">
                <div class="flex items-center gap-2 mb-1">
                  <span class="badge badge-success text-xs">READY TO UPLOAD</span>
                  <span class="text-xs text-slate-600 font-mono font-semibold">{{ selectedFileName() }}</span>
                </div>
                <p class="text-xs text-slate-600 mb-3">
                  Preview generated. This image will be permanently uploaded and saved to your store.
                </p>

                <div class="flex gap-2">
                  <button
                    type="button"
                    (click)="fileInput.click()"
                    class="btn btn-secondary btn-xs font-bold"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    (click)="removeImage()"
                    class="btn btn-danger btn-xs font-bold"
                  >
                    Remove
                  </button>
                  <input
                    #fileInput
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    (change)="onFileSelected($event)"
                    class="hidden"
                  />
                </div>
              </div>
            </div>

            <span *ngIf="imageError()" class="text-xs text-danger mt-1.5 block font-medium">
              {{ imageError() }}
            </span>
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage()" class="admin-alert-error mb-4">
            <span>{{ errorMessage() }}</span>
          </div>

          <!-- Form Action Footer -->
          <div class="flex-between border-t border-slate-200 pt-5 mt-4">
            <button
              type="button"
              (click)="resetForm()"
              class="btn btn-secondary btn-sm font-bold"
            >
              Reset Details
            </button>

            <button
              type="submit"
              [disabled]="saving()"
              class="btn btn-brand btn-sm font-bold flex items-center gap-2 px-6"
            >
              <span *ngIf="saving()" class="spinner-inline"></span>
              {{ saving() ? 'Uploading & Publishing...' : 'Save & Publish Product' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .add-product-container {
      max-width: 900px;
      margin: 0 auto;
    }
    .max-w-2xl { max-width: 44rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .hidden { display: none; }
    .cursor-pointer { cursor: pointer; }
    .pl-8 { padding-left: 2rem !important; }
    .price-input-prefix {
      position: absolute;
      left: 0.75rem;
      font-weight: 700;
      color: #64748b;
      font-size: 0.95rem;
      pointer-events: none;
    }
    .upload-dropzone:hover {
      background: #fef3c7;
      border-color: #d97706;
    }
    .preview-img {
      max-width: 120px;
      max-height: 120px;
      object-fit: cover;
    }
    .spinner-inline {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class AdminAddProductComponent {
  private adminService = inject(AdminService);
  private router = inject(Router);

  name = '';
  price: number | null = null;
  description = '';

  stepPrice(delta: number): void {
    const cur = Number(this.price) || 0;
    const next = Math.max(0, cur + delta);
    this.price = Math.round(next * 100) / 100;
  }

  selectedFile: File | null = null;
  selectedFileName = signal<string>('');
  imagePreview = signal<string | null>(null);
  imageError = signal<string | null>(null);

  saving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.imageError.set('Selected file must be an image (PNG, JPG, WEBP, GIF).');
      return;
    }

    this.selectedFile = file;
    this.selectedFileName.set(file.name);
    this.imageError.set(null);

    // Read and create immediate local preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.selectedFileName.set('');
    this.imagePreview.set(null);
    this.imageError.set(null);
  }

  resetForm(): void {
    this.name = '';
    this.price = null;
    this.description = '';
    this.removeImage();
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.name.trim()) {
      this.errorMessage.set('Please enter a product name.');
      return;
    }
    if (!this.price || this.price <= 0) {
      this.errorMessage.set('Please enter a valid price greater than ₹0.');
      return;
    }
    if (!this.description.trim()) {
      this.errorMessage.set('Please enter a description for the product.');
      return;
    }
    if (!this.selectedFile && !this.imagePreview()) {
      this.imageError.set('Please select a product image from your computer.');
      return;
    }

    this.saving.set(true);

    // Step 1: Upload image to server
    if (this.selectedFile) {
      this.adminService.uploadImage(this.selectedFile).subscribe({
        next: (uploadRes) => {
          const finalImageUrl = uploadRes.data?.url || uploadRes.data?.relativeUrl;
          this.saveProductRecord(finalImageUrl);
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to upload image to server. Please try again.');
        },
      });
    } else {
      // If preview already exists from data URL
      this.saveProductRecord(this.imagePreview()!);
    }
  }

  private saveProductRecord(imageUrl: string): void {
    const productPayload = {
      name: this.name.trim(),
      price: Number(this.price),
      base_price: Number(this.price),
      description: this.description.trim(),
      image_urls: [imageUrl],
      is_active: true,
      stock_quantity: 50,
    };

    this.adminService.createProduct(productPayload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.successMessage.set(`"${this.name}" has been permanently added with price ₹${Number(this.price).toFixed(2)}.`);
        // Clean fields for next entry
        this.name = '';
        this.price = null;
        this.description = '';
        this.removeImage();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save product details. Please verify your connection.');
      },
    });
  }
}
