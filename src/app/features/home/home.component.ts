import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Product, Category } from '../../core/models/ecommerce.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Hero Banner Section -->
    <section class="hero-section">
      <div class="container hero-container">
        <div class="hero-content">
          <span class="hero-tag">AUTUMN / WINTER 2026 EDITION</span>
          <h1 class="hero-title">Precision Audio &amp; Architectural Tech</h1>
          <p class="hero-desc">
            Discover bespoke beryllium acoustics, aerospace-grade titanium wearables, and CNC-milled workstation hardware engineered for discerning creators.
          </p>
          <div class="hero-cta-group">
            <a routerLink="/products" class="btn btn-brand btn-lg">Explore Catalog &rarr;</a>
            <a routerLink="/products" [queryParams]="{ category: 'audio-acoustics' }" class="btn btn-outline btn-lg text-white border-white">
              Listen to Aether Pro
            </a>
          </div>
          <div class="hero-highlights">
            <div class="highlight-item">
              <span class="highlight-num">40h</span>
              <span class="highlight-label">Acoustic Battery</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-num">Gr. 5</span>
              <span class="highlight-label">Pure Titanium</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-num">100%</span>
              <span class="highlight-label">Authentic Craft</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-card-glow">
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80"
              alt="Aether Pro Headphones"
              class="hero-image"
            />
            <div class="floating-badge">
              <span class="badge badge-gold">ICON OF THE SEASON</span>
              <span class="text-xs font-semibold">Aether Pro Wireless ANC</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Grid -->
    <section class="categories-section py-5">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Curated Categories</h2>
            <p class="text-muted text-sm">Explore by engineering category and lifestyle discipline.</p>
          </div>
          <a routerLink="/products" class="text-sm font-semibold text-primary hover:text-brand">View All &rarr;</a>
        </div>

        <div class="categories-grid">
          <div
            *ngFor="let cat of categories()"
            [routerLink]="['/products']"
            [queryParams]="{ category: cat.slug }"
            class="category-card"
          >
            <div class="category-img-wrap">
              <img [src]="cat.image_url" [alt]="cat.name" class="category-img" />
              <div class="category-overlay"></div>
            </div>
            <div class="category-info">
              <h3 class="category-name">{{ cat.name }}</h3>
              <p class="category-desc">{{ cat.description }}</p>
              <span class="category-link">Shop Collection &rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products Showcase -->
    <section class="featured-section py-5">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Featured Creations</h2>
            <p class="text-muted text-sm">Handpicked for peak craftsmanship and acoustic performance.</p>
          </div>
          <span class="badge badge-gold">IN STOCK &amp; READY TO SHIP</span>
        </div>

        <div class="products-grid">
          <div *ngFor="let product of featuredProducts()" class="product-card">
            <!-- Card Image -->
            <div class="product-img-wrap">
              <a [routerLink]="['/products', product.slug]">
                <img
                  [src]="product.images[0].image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'"
                  [alt]="product.name"
                  class="product-img"
                />
              </a>

              <!-- Wishlist Heart -->
              <button
                (click)="wishlistService.toggleWishlist(product.id).subscribe()"
                class="btn-wishlist"
                [class.active]="wishlistService.isInWishlist(product.id)"
                title="Wishlist"
              >
                {{ wishlistService.isInWishlist(product.id) ? '♥' : '♡' }}
              </button>

              <!-- Discount or Featured Badge -->
              <span *ngIf="product.compare_at_price && product.compare_at_price > product.base_price" class="badge-discount">
                SAVE {{ getDiscountPercent(product.base_price, product.compare_at_price) }}%
              </span>
            </div>

            <!-- Card Body -->
            <div class="product-body">
              <span class="product-category">{{ product.category?.name || 'Luxury Gear' }}</span>
              <h3 class="product-title">
                <a [routerLink]="['/products', product.slug]">{{ product.name }}</a>
              </h3>
              <p class="product-short-desc">{{ product.short_description }}</p>

              <div class="product-price-row">
                <div class="price-stack">
                  <span class="current-price">₹{{ product.base_price | number: '1.2-2' }}</span>
                  <span *ngIf="product.compare_at_price" class="old-price">₹{{ product.compare_at_price | number: '1.2-2' }}</span>
                </div>

                <button
                  (click)="quickAddToCart(product)"
                  class="btn btn-primary btn-sm"
                  [disabled]="!product.is_in_stock || addingId() === product.id"
                >
                  {{ addingId() === product.id ? 'Adding...' : 'Add to Bag' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Value Propositions -->
    <section class="value-props-section py-5">
      <div class="container value-grid">
        <div class="value-card">
          <div class="value-icon">✈️</div>
          <h4 class="value-title">Complimentary Express</h4>
          <p class="value-desc">Priority air freight courier delivery on all orders exceeding ₹1,500.</p>
        </div>
        <div class="value-card">
          <div class="value-icon">🛡️</div>
          <h4 class="value-title">Two-Year Comprehensive Warranty</h4>
          <p class="value-desc">Every piece is backed by our full craftsmanship guarantee.</p>
        </div>
        <div class="value-card">
          <div class="value-icon">💎</div>
          <h4 class="value-title">Artisan Materials</h4>
          <p class="value-desc">Precision milled Grade 5 titanium, Tuscan full-grain leather, and acoustic beryllium.</p>
        </div>
        <div class="value-card">
          <div class="value-icon">🛎️</div>
          <h4 class="value-title">24/7 VIP Concierge</h4>
          <p class="value-desc">Dedicated product specialists available around the clock via secure chat and phone.</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e293b 100%);
      color: #ffffff;
      padding: 5rem 0;
      position: relative;
      overflow: hidden;
    }
    .hero-container {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      align-items: center;
      gap: 4rem;
    }
    .hero-tag {
      font-size: 0.75rem;
      letter-spacing: 0.25em;
      font-weight: 800;
      color: var(--color-brand);
      margin-bottom: 1rem;
      display: inline-block;
    }
    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: 1.25rem;
    }
    .hero-desc {
      font-size: 1.15rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 2rem;
      max-width: 580px;
    }
    .hero-cta-group {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 3.5rem;
    }
    .hero-highlights {
      display: flex;
      gap: 3rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 2rem;
    }
    .highlight-num {
      display: block;
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
    }
    .highlight-label {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .hero-visual {
      position: relative;
      display: flex;
      justify-content: center;
    }
    .hero-card-glow {
      position: relative;
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px var(--color-brand-glow);
    }
    .hero-image {
      width: 100%;
      height: 480px;
      object-fit: cover;
      display: block;
      transition: transform 0.5s ease;
    }
    .hero-card-glow:hover .hero-image {
      transform: scale(1.03);
    }
    .floating-badge {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      right: 1.5rem;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(10px);
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2.5rem;
    }
    .section-title {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .category-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--color-surface-border);
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: all var(--transition-smooth);
    }
    .category-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-lg);
    }
    .category-img-wrap {
      position: relative;
      height: 200px;
    }
    .category-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .category-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.6) 0%, transparent 60%);
    }
    .category-info {
      padding: 1.25rem;
    }
    .category-name {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 0.35rem;
    }
    .category-desc {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      margin-bottom: 0.75rem;
    }
    .category-link {
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--color-brand);
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }
    .product-card {
      background: #ffffff;
      border: 1px solid var(--color-surface-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-smooth);
      display: flex;
      flex-direction: column;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .product-img-wrap {
      position: relative;
      height: 260px;
      background: #f8fafc;
      overflow: hidden;
    }
    .product-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .product-card:hover .product-img {
      transform: scale(1.05);
    }
    .btn-wishlist {
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
      font-size: 1.15rem;
      box-shadow: var(--shadow-sm);
      color: var(--color-text-muted);
      transition: all var(--transition-fast);
    }
    .btn-wishlist:hover, .btn-wishlist.active {
      color: #ef4444;
      background: #ffffff;
    }
    .badge-discount {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      background: var(--color-brand);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      letter-spacing: 0.05em;
    }
    .product-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .product-category {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--color-brand);
      margin-bottom: 0.25rem;
    }
    .product-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }
    .product-short-desc {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      margin-bottom: 1.25rem;
      line-height: 1.5;
      flex: 1;
    }
    .product-price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--color-surface-border);
      padding-top: 1rem;
    }
    .price-stack {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .current-price {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--color-primary);
    }
    .old-price {
      font-size: 0.9rem;
      color: var(--color-text-subtle);
      text-decoration: line-through;
    }
    .value-props-section {
      background: #ffffff;
      border-top: 1px solid var(--color-surface-border);
    }
    .value-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }
    .value-card {
      text-align: center;
      padding: 2rem 1.5rem;
    }
    .value-icon {
      font-size: 2.25rem;
      margin-bottom: 1rem;
    }
    .value-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .value-desc {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      line-height: 1.5;
    }
    .py-5 { padding-top: 4.5rem; padding-bottom: 4.5rem; }
    @media (max-width: 900px) {
      .hero-container { grid-template-columns: 1fr; }
      .hero-title { font-size: 2.5rem; }
      .value-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
      .value-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);

  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  addingId = signal<string | null>(null);

  ngOnInit(): void {
    this.productService.getCategories().subscribe((res) => {
      if (res.success) this.categories.set(res.data);
    });

    this.productService.getFeatured().subscribe((res) => {
      if (res.success) this.featuredProducts.set(res.data);
    });
  }

  getDiscountPercent(basePrice: number, comparePrice: number): number {
    return Math.round(((comparePrice - basePrice) / comparePrice) * 100);
  }

  quickAddToCart(product: Product): void {
    this.addingId.set(product.id);
    this.cartService.addToCart(product.id, null, 1).subscribe({
      next: () => this.addingId.set(null),
      error: () => this.addingId.set(null),
    });
  }
}
