import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Product, Category } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="catalog-page py-4">
      <div class="container">
        <!-- Breadcrumb & Header -->
        <div class="catalog-header mb-4">
          <div class="breadcrumb text-xs text-muted mb-2">
            <a routerLink="/">Home</a> &bull; <span>Catalog</span>
            <span *ngIf="selectedCategory"> &bull; {{ getCategoryName(selectedCategory) }}</span>
          </div>
          <div class="catalog-title-row">
            <div>
              <h1 class="catalog-heading">Artisan Catalog</h1>
              <p class="text-sm text-muted">Showing {{ meta().total || 0 }} authentic pieces</p>
            </div>

            <!-- Sorting & Stock Filter -->
            <div class="sort-controls">
              <label class="sort-label">Sort by:</label>
              <select [(ngModel)]="selectedSort" (change)="applyFilters()" class="sort-select">
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="featured">Featured First</option>
              </select>
            </div>
          </div>
        </div>

        <div class="catalog-layout">
          <!-- Sidebar Filters -->
          <aside class="filter-sidebar">
            <div class="sidebar-block">
              <h3 class="filter-title">Categories</h3>
              <ul class="filter-list">
                <li [class.active]="!selectedCategory">
                  <button (click)="selectCategory('')" class="filter-btn">
                    <span>All Creations</span>
                  </button>
                </li>
                <li *ngFor="let cat of categories()" [class.active]="selectedCategory === cat.slug">
                  <button (click)="selectCategory(cat.slug)" class="filter-btn">
                    <span>{{ cat.name }}</span>
                    <span class="count-badge" *ngIf="cat.productCount">({{ cat.productCount }})</span>
                  </button>
                </li>
              </ul>
            </div>

            <div class="sidebar-block">
              <h3 class="filter-title">Price Range (₹)</h3>
              <div class="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  [(ngModel)]="minPrice"
                  (change)="applyFilters()"
                  class="price-input"
                />
                <span class="text-muted">&ndash;</span>
                <input
                  type="number"
                  placeholder="Max"
                  [(ngModel)]="maxPrice"
                  (change)="applyFilters()"
                  class="price-input"
                />
              </div>
            </div>

            <div class="sidebar-block">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="inStockOnly" (change)="applyFilters()" />
                <span>In Stock Only</span>
              </label>
            </div>

            <button *ngIf="hasActiveFilters()" (click)="clearFilters()" class="btn btn-secondary btn-sm w-full">
              Reset Filters
            </button>
          </aside>

          <!-- Products Content Area -->
          <main class="products-area">
            <!-- Loading indicator -->
            <div *ngIf="loading()" class="loading-state">
              <div class="spinner"></div>
              <span>Curating collection...</span>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loading() && products().length === 0" class="empty-state">
              <div class="empty-icon">🔍</div>
              <h3>No creations matched your criteria</h3>
              <p class="text-sm text-muted mb-3">Try adjusting your filters, price range, or search keyword.</p>
              <button (click)="clearFilters()" class="btn btn-primary btn-sm">Clear All Filters</button>
            </div>

            <!-- Products Grid -->
            <div *ngIf="!loading() && products().length > 0" class="catalog-grid">
              <div *ngFor="let product of products()" class="catalog-card">
                <div class="catalog-card-media">
                  <a [routerLink]="['/products', product.slug]">
                    <img
                      [src]="product.images[0].image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'"
                      [alt]="product.name"
                      class="media-img"
                    />
                  </a>

                  <!-- Wishlist Button -->
                  <button
                    (click)="wishlistService.toggleWishlist(product.id).subscribe()"
                    class="card-wishlist-btn"
                    [class.active]="wishlistService.isInWishlist(product.id)"
                    title="Toggle Wishlist"
                  >
                    {{ wishlistService.isInWishlist(product.id) ? '♥' : '♡' }}
                  </button>

                  <span *ngIf="product.compare_at_price && product.compare_at_price > product.base_price" class="card-discount-pill">
                    -{{ getDiscountPercent(product.base_price, product.compare_at_price) }}%
                  </span>

                  <span *ngIf="!product.is_in_stock" class="card-stock-pill">
                    Sold Out
                  </span>
                </div>

                <div class="catalog-card-details">
                  <span class="card-category">{{ product.category?.name || 'Exclusive' }}</span>
                  <h2 class="card-name">
                    <a [routerLink]="['/products', product.slug]">{{ product.name }}</a>
                  </h2>

                  <div class="card-footer">
                    <div class="price-box">
                      <span class="price-val">₹{{ product.base_price | number: '1.2-2' }}</span>
                      <span *ngIf="product.compare_at_price" class="old-price-val">₹{{ product.compare_at_price | number: '1.2-2' }}</span>
                    </div>

                    <button
                      (click)="addToCart(product)"
                      class="btn btn-primary btn-sm"
                      [disabled]="!product.is_in_stock || addingId() === product.id"
                    >
                      {{ addingId() === product.id ? 'Adding...' : 'Add to Bag' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div *ngIf="meta().totalPages > 1" class="pagination-row mt-4">
              <button
                (click)="goToPage(meta().page - 1)"
                [disabled]="meta().page <= 1"
                class="btn btn-secondary btn-sm"
              >
                &larr; Previous
              </button>
              <span class="text-sm font-semibold">Page {{ meta().page }} of {{ meta().totalPages }}</span>
              <button
                (click)="goToPage(meta().page + 1)"
                [disabled]="meta().page >= meta().totalPages"
                class="btn btn-secondary btn-sm"
              >
                Next &rarr;
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .catalog-header {
      border-bottom: 1px solid var(--color-surface-border);
      padding-bottom: 1.5rem;
    }
    .catalog-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .catalog-heading {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .sort-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .sort-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }
    .sort-select {
      padding: 0.5rem 1rem;
      border: 1px solid var(--color-surface-border);
      border-radius: var(--radius-md);
      background: #ffffff;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
    }
    .catalog-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 2.5rem;
      margin-top: 2rem;
    }
    .filter-sidebar {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .sidebar-block {
      border-bottom: 1px solid var(--color-surface-border);
      padding-bottom: 1.5rem;
    }
    .filter-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: var(--color-primary);
    }
    .filter-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .filter-btn {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.45rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      color: var(--color-text-muted);
      font-weight: 500;
      transition: all var(--transition-fast);
      text-align: left;
    }
    .filter-btn:hover {
      background: var(--color-surface-subtle);
      color: var(--color-primary);
    }
    .filter-list li.active .filter-btn {
      background: var(--color-primary);
      color: #ffffff;
      font-weight: 700;
    }
    .price-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .price-input {
      width: 100%;
      padding: 0.45rem 0.65rem;
      border: 1px solid var(--color-surface-border);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
    }
    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.75rem;
    }
    .catalog-card {
      background: #ffffff;
      border: 1px solid var(--color-surface-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all var(--transition-smooth);
    }
    .catalog-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .catalog-card-media {
      position: relative;
      height: 250px;
      background: #f8fafc;
      overflow: hidden;
    }
    .media-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .catalog-card:hover .media-img {
      transform: scale(1.05);
    }
    .card-wishlist-btn {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      box-shadow: var(--shadow-sm);
      color: var(--color-text-muted);
    }
    .card-wishlist-btn.active {
      color: #ef4444;
      background: #ffffff;
    }
    .card-discount-pill {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      background: var(--color-brand);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .card-stock-pill {
      position: absolute;
      bottom: 0.75rem;
      left: 0.75rem;
      background: rgba(15, 23, 42, 0.85);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-full);
    }
    .catalog-card-details {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .card-category {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--color-brand);
      margin-bottom: 0.25rem;
    }
    .card-name {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 1rem;
      line-height: 1.35;
      flex: 1;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--color-surface-border);
      padding-top: 0.85rem;
    }
    .price-box {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }
    .price-val {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-primary);
    }
    .old-price-val {
      font-size: 0.85rem;
      color: var(--color-text-subtle);
      text-decoration: line-through;
    }
    .loading-state, .empty-state {
      text-align: center;
      padding: 5rem 2rem;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: var(--color-brand);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .pagination-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
    }
    .w-full { width: 100%; }
    .py-4 { padding-top: 2rem; padding-bottom: 2rem; }
    @media (max-width: 900px) {
      .catalog-layout { grid-template-columns: 1fr; }
      .catalog-title-row { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
  `],
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  meta = signal<any>({ total: 0, page: 1, totalPages: 1 });
  loading = signal(false);
  addingId = signal<string | null>(null);

  selectedCategory = '';
  selectedSort = 'newest';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  inStockOnly = false;
  searchQuery = '';

  ngOnInit(): void {
    this.productService.getCategories().subscribe((res) => {
      if (res.success) this.categories.set(res.data);
    });

    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['category'] || '';
      this.searchQuery = params['search'] || '';
      this.fetchProducts();
    });
  }

  fetchProducts(page = 1): void {
    this.loading.set(true);
    this.productService
      .getProducts({
        page,
        category: this.selectedCategory,
        search: this.searchQuery,
        sort: this.selectedSort,
        min_price: this.minPrice || undefined,
        max_price: this.maxPrice || undefined,
        in_stock: this.inStockOnly ? 'true' : undefined,
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.products.set(res.data);
            this.meta.set(res.meta);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  selectCategory(slug: string): void {
    this.selectedCategory = slug;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: slug || null },
      queryParamsHandling: 'merge',
    });
  }

  applyFilters(): void {
    this.fetchProducts(1);
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.searchQuery = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.inStockOnly = false;
    this.selectedSort = 'newest';
    this.router.navigate(['/products']);
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedCategory || this.minPrice || this.maxPrice || this.inStockOnly || this.searchQuery);
  }

  getCategoryName(slug: string): string {
    const cat = this.categories().find((c) => c.slug === slug);
    return cat ? cat.name : slug;
  }

  getDiscountPercent(basePrice: number, comparePrice: number): number {
    return Math.round(((comparePrice - basePrice) / comparePrice) * 100);
  }

  addToCart(product: Product): void {
    this.addingId.set(product.id);
    this.cartService.addToCart(product.id, null, 1).subscribe({
      next: () => this.addingId.set(null),
      error: () => this.addingId.set(null),
    });
  }

  goToPage(p: number): void {
    this.fetchProducts(p);
  }
}
