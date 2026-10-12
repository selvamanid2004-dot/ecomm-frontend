import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Product, ProductVariant } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="product-page py-4" *ngIf="product(); else loadingTpl">
      <div class="container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb text-xs text-muted mb-4">
          <a routerLink="/">Home</a> &bull;
          <a routerLink="/products">Catalog</a> &bull;
          <a *ngIf="product()?.category" [routerLink]="['/products']" [queryParams]="{ category: product()?.category?.slug }">
            {{ product()?.category?.name }}
          </a>
          &bull; <span>{{ product()?.name }}</span>
        </nav>

        <div class="product-hero-grid">
          <!-- Gallery Section -->
          <div class="gallery-wrapper">
            <div class="main-image-container" (click)="openLightbox()">
              <img
                [src]="activeImage() || product()?.images?.[0]?.image_url"
                [alt]="product()?.name"
                class="main-img"
              />
              <button class="zoom-btn" title="Click to zoom in full-screen">🔍</button>
            </div>

            <!-- Thumbnails List -->
            <div class="thumbnails-track" *ngIf="product()?.images && product()!.images.length > 1">
              <button
                *ngFor="let img of product()!.images"
                (click)="activeImage.set(img.image_url)"
                class="thumb-btn"
                [class.active]="(activeImage() || product()?.images?.[0]?.image_url) === img.image_url"
              >
                <img [src]="img.image_url" [alt]="img.alt_text || 'Angle preview'" class="thumb-img" />
              </button>
            </div>
          </div>

          <!-- Product Details Form -->
          <div class="product-info-col">
            <span class="category-tag">{{ product()?.category?.name || 'Exclusive Release' }}</span>
            <h1 class="product-title">{{ product()?.name }}</h1>
            <div class="sku-rating-row text-xs text-muted mb-3">
              <span>SKU: <strong>{{ selectedVariant()?.sku || product()?.sku }}</strong></span>
              <span>&bull;</span>
              <span class="stock-status" [class.in-stock]="product()?.is_in_stock" [class.out-of-stock]="!product()?.is_in_stock">
                {{ product()?.is_in_stock ? '● In Stock' : '○ Currently Sold Out' }}
              </span>
            </div>

            <!-- Pricing Box -->
            <div class="price-container">
              <span class="current-price">₹{{ currentPrice() | number: '1.2-2' }}</span>
              <span *ngIf="product()?.compare_at_price" class="compare-price">
                ₹{{ product()?.compare_at_price | number: '1.2-2' }}
              </span>
              <span *ngIf="product()?.compare_at_price && product()!.compare_at_price! > currentPrice()" class="savings-tag">
                Save ₹{{ (product()!.compare_at_price! - currentPrice()) | number: '1.2-2' }}
              </span>
            </div>

            <p class="product-short-desc mb-4">{{ product()?.short_description }}</p>

            <!-- Variants Selection -->
            <div class="variants-block mb-4" *ngIf="product()?.variants && product()!.variants.length > 0">
              <label class="variant-label">Select Configuration:</label>
              <div class="variant-chips">
                <button
                  *ngFor="let v of product()!.variants"
                  (click)="selectVariant(v)"
                  class="variant-chip"
                  [class.active]="selectedVariant()?.id === v.id"
                >
                  <span>{{ v.title }}</span>
                  <span *ngIf="v.price_override" class="chip-price">₹{{ v.price_override | number: '1.2-2' }}</span>
                </button>
              </div>
            </div>

            <!-- Quantity & Actions -->
            <div class="purchase-actions mb-4">
              <div class="qty-picker">
                <button (click)="decrementQty()" [disabled]="quantity <= 0" class="qty-btn">&minus;</button>
                <span class="qty-val">{{ quantity }}</span>
                <button (click)="incrementQty()" [disabled]="quantity >= currentStock()" class="qty-btn">&plus;</button>
              </div>

              <button
                (click)="addToBag()"
                class="btn btn-brand btn-lg flex-1"
                [disabled]="!product()?.is_in_stock || isAdding()"
              >
                {{ isAdding() ? 'Adding to Bag...' : 'Add to Shopping Bag' }}
              </button>

              <button
                (click)="wishlistService.toggleWishlist(product()!.id).subscribe()"
                class="btn-wishlist-large"
                [class.active]="wishlistService.isInWishlist(product()!.id)"
                title="Save to Wishlist"
              >
                {{ wishlistService.isInWishlist(product()!.id) ? '♥' : '♡' }}
              </button>
            </div>

            <div class="assurance-bullets text-xs text-muted">
              <div class="bullet-item"><span>✦</span> 30-Day Bespoke Risk-Free Trial</div>
              <div class="bullet-item"><span>✦</span> Insured Worldwide Express Freight</div>
              <div class="bullet-item"><span>✦</span> Certificate of Authentic Provenance</div>
            </div>
          </div>
        </div>

        <!-- Description & Specifications Tabs -->
        <div class="specs-section mt-5">
          <div class="tabs-header">
            <button (click)="activeTab = 'desc'" class="tab-btn" [class.active]="activeTab === 'desc'">
              Architectural Overview
            </button>
            <button (click)="activeTab = 'reviews'" class="tab-btn" [class.active]="activeTab === 'reviews'">
              Verified Reviews ({{ product()?.reviews?.length || 0 }})
            </button>
          </div>

          <div class="tab-body card" *ngIf="activeTab === 'desc'">
            <div class="long-description">
              <p>{{ product()?.description }}</p>
            </div>
          </div>

          <div class="tab-body card" *ngIf="activeTab === 'reviews'">
            <div *ngIf="!product()?.reviews || product()!.reviews!.length === 0" class="text-muted text-sm text-center py-4">
              No reviews registered yet. Be the first to review this creation.
            </div>

            <div class="reviews-list" *ngIf="product()?.reviews && product()!.reviews!.length > 0">
              <div *ngFor="let rev of product()!.reviews" class="review-item">
                <div class="review-top flex-between mb-1">
                  <span class="font-bold text-sm">{{ rev.customer_name }}</span>
                  <span class="review-stars">★ ★ ★ ★ ★</span>
                </div>
                <p class="review-text text-sm text-muted">{{ rev.comment }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen Lightbox Modal -->
    <div class="modal-backdrop" *ngIf="lightboxOpen()" (click)="lightboxOpen.set(false)">
      <div class="lightbox-content" (click)="$event.stopPropagation()">
        <img [src]="activeImage() || product()?.images?.[0]?.image_url" [alt]="product()?.name" class="lightbox-img" />
        <button (click)="lightboxOpen.set(false)" class="lightbox-close">&times;</button>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="container text-center py-5">
        <div class="spinner"></div>
        <span>Loading creation specifications...</span>
      </div>
    </ng-template>
  `,
  styles: [`
    .product-hero-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 3.5rem;
      align-items: start;
    }
    .gallery-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .main-image-container {
      position: relative;
      height: 480px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      background: #f8fafc;
      border: 1px solid var(--color-surface-border);
      cursor: zoom-in;
    }
    .main-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .main-image-container:hover .main-img {
      transform: scale(1.03);
    }
    .zoom-btn {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      background: rgba(15, 23, 42, 0.7);
      color: #ffffff;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.9rem;
    }
    .thumbnails-track {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
    }
    .thumb-btn {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 2px solid transparent;
      padding: 0;
      background: #f1f5f9;
      cursor: pointer;
      transition: border-color var(--transition-fast);
    }
    .thumb-btn.active {
      border-color: var(--color-brand);
    }
    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .category-tag {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: var(--color-brand);
      text-transform: uppercase;
      margin-bottom: 0.5rem;
      display: inline-block;
    }
    .product-title {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: 0.75rem;
    }
    .sku-rating-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .stock-status.in-stock { color: var(--color-success); font-weight: 600; }
    .stock-status.out-of-stock { color: var(--color-danger); font-weight: 600; }
    .price-container {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .current-price {
      font-size: 2rem;
      font-weight: 800;
      color: var(--color-primary);
    }
    .compare-price {
      font-size: 1.2rem;
      color: var(--color-text-subtle);
      text-decoration: line-through;
    }
    .savings-tag {
      background: #fef3c7;
      color: #92400e;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 700;
    }
    .product-short-desc {
      font-size: 1rem;
      color: var(--color-text-muted);
      line-height: 1.6;
    }
    .variant-label {
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      display: block;
    }
    .variant-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .variant-chip {
      padding: 0.5rem 1rem;
      border: 1.5px solid var(--color-surface-border);
      border-radius: var(--radius-md);
      background: #ffffff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .variant-chip.active {
      border-color: var(--color-primary);
      background: var(--color-primary);
      color: #ffffff;
    }
    .chip-price {
      font-size: 0.75rem;
      opacity: 0.8;
    }
    .purchase-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .qty-picker {
      display: flex;
      align-items: center;
      border: 1.5px solid var(--color-surface-border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .qty-btn {
      width: 2.5rem;
      height: 2.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      background: var(--color-surface-subtle);
    }
    .qty-val {
      width: 2.5rem;
      text-align: center;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .btn-wishlist-large {
      width: 3.2rem;
      height: 3.2rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--color-surface-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      color: var(--color-text-muted);
      background: #ffffff;
      cursor: pointer;
    }
    .btn-wishlist-large.active {
      color: #ef4444;
      border-color: #ef4444;
    }
    .assurance-bullets {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-surface-border);
    }
    .bullet-item span {
      color: var(--color-brand);
      font-weight: 800;
    }
    .tabs-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .tab-btn {
      padding: 0.75rem 1.5rem;
      font-weight: 700;
      font-size: 0.95rem;
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      background: transparent;
    }
    .tab-btn.active {
      background: var(--color-primary);
      color: #ffffff;
    }
    .tab-body {
      padding: 2rem;
    }
    .long-description {
      font-size: 1rem;
      line-height: 1.8;
      color: var(--color-text-main);
      white-space: pre-line;
    }
    .review-item {
      padding: 1.25rem 0;
      border-bottom: 1px solid var(--color-surface-border);
    }
    .review-stars {
      color: #f59e0b;
      font-size: 0.85rem;
    }
    .lightbox-content {
      max-width: 90vw;
      max-height: 90vh;
      position: relative;
    }
    .lightbox-img {
      max-width: 100%;
      max-height: 85vh;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
    }
    .lightbox-close {
      position: absolute;
      top: -2rem;
      right: 0;
      color: #ffffff;
      font-size: 2rem;
    }
    .flex-1 { flex: 1; }
    .mt-5 { margin-top: 3.5rem; }
    .py-4 { padding-top: 2rem; padding-bottom: 2rem; }
    @media (max-width: 900px) {
      .product-hero-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  wishlistService = inject(WishlistService);

  product = signal<Product | null>(null);
  selectedVariant = signal<ProductVariant | null>(null);
  activeImage = signal<string | null>(null);
  lightboxOpen = signal(false);
  isAdding = signal(false);

  quantity = 0;
  activeTab = 'desc';

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const identifier = params['id'];
      if (identifier) {
        this.productService.getProduct(identifier).subscribe((res) => {
          if (res.success) {
            this.product.set(res.data);
            if (res.data.images && res.data.images.length > 0) {
              this.activeImage.set(res.data.images[0].image_url);
            }
            if (res.data.variants && res.data.variants.length > 0) {
              this.selectedVariant.set(res.data.variants[0]);
            }
          }
        });
      }
    });
  }

  selectVariant(v: ProductVariant): void {
    this.selectedVariant.set(v);
    if (this.quantity > v.stock_quantity) {
      this.quantity = Math.max(0, v.stock_quantity);
    }
  }

  currentPrice(): number {
    const v = this.selectedVariant();
    if (v && v.price_override) return v.price_override;
    return this.product()?.base_price || 0;
  }

  currentStock(): number {
    const v = this.selectedVariant();
    if (v) return v.stock_quantity;
    return this.product()?.stock_quantity || 0;
  }

  incrementQty(): void {
    if (this.quantity < this.currentStock()) {
      this.quantity++;
    }
  }

  decrementQty(): void {
    if (this.quantity > 0) {
      this.quantity--;
    }
  }

  openLightbox(): void {
    this.lightboxOpen.set(true);
  }

  addToBag(): void {
    const p = this.product();
    if (!p) return;

    const qty = this.quantity > 0 ? this.quantity : 1;
    this.isAdding.set(true);
    this.cartService.addToCart(p.id, this.selectedVariant()?.id, qty).subscribe({
      next: () => this.isAdding.set(false),
      error: () => this.isAdding.set(false),
    });
  }
}
