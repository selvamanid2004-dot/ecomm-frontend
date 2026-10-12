import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="wishlist-page py-5">
      <div class="container">
        <h1 class="page-title mb-4">Saved Creations</h1>

        <!-- Empty State -->
        <div *ngIf="wishlistService.count() === 0" class="empty-wishlist card text-center py-5">
          <div class="empty-icon mb-3">♡</div>
          <h2 class="text-xl font-bold mb-2">Your Wishlist is Empty</h2>
          <p class="text-sm text-muted mb-4 max-w-md mx-auto">
            Curate your private selection of favorite items by tapping the heart icon on any product page.
          </p>
          <a routerLink="/products" class="btn btn-primary btn-md">Explore Collection &rarr;</a>
        </div>

        <!-- Wishlist Grid -->
        <div *ngIf="wishlistService.count() > 0" class="wishlist-grid">
          <div *ngFor="let item of wishlistService.wishlist()?.items" class="wishlist-card card p-0 overflow-hidden">
            <div class="card-media">
              <a [routerLink]="['/products', item.slug]">
                <img [src]="item.image" [alt]="item.name" class="media-img" />
              </a>
              <button
                (click)="wishlistService.removeItem(item.productId).subscribe()"
                class="btn-remove"
                title="Remove from Wishlist"
              >
                &times;
              </button>
            </div>

            <div class="card-details p-4">
              <span class="text-xs text-brand font-bold uppercase block mb-1">{{ item.categoryName || 'Exclusive' }}</span>
              <h3 class="card-title font-bold text-sm mb-2">
                <a [routerLink]="['/products', item.slug]">{{ item.name }}</a>
              </h3>
              <div class="price-row flex-between mt-3 pt-3 border-top">
                <span class="font-extrabold text-base">₹{{ item.price | number: '1.2-2' }}</span>
                <button
                  (click)="moveToCart(item.productId)"
                  class="btn btn-primary btn-sm"
                  [disabled]="!item.isInStock"
                >
                  {{ item.isInStock ? 'Move to Bag' : 'Out of Stock' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .empty-icon { font-size: 3.5rem; color: var(--color-text-subtle); }
    .wishlist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
    }
    .card-media {
      position: relative;
      height: 240px;
      background: #f8fafc;
    }
    .media-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .btn-remove {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      color: var(--color-danger);
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .border-top { border-top: 1px solid var(--color-surface-border); }
    .py-5 { padding-top: 3rem; padding-bottom: 3rem; }
  `],
})
export class WishlistComponent {
  wishlistService = inject(WishlistService);
  private cartService = inject(CartService);

  moveToCart(productId: string): void {
    this.cartService.addToCart(productId, null, 1).subscribe({
      next: () => {
        this.wishlistService.removeItem(productId).subscribe();
      },
    });
  }
}
