import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WishlistSummary } from '../models/ecommerce.models';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly apiUrl = `${environment.apiUrl}/wishlist`;

  wishlist = signal<WishlistSummary | null>(null);
  count = computed(() => this.wishlist()?.count || 0);

  constructor(private http: HttpClient) {
    this.refreshWishlist().subscribe();
  }

  refreshWishlist(): Observable<{ success: boolean; data: WishlistSummary }> {
    return this.http.get<{ success: boolean; data: WishlistSummary }>(this.apiUrl).pipe(
      tap((res) => {
        if (res.success) {
          this.wishlist.set(res.data);
        }
      })
    );
  }

  toggleWishlist(productId: string): Observable<{ success: boolean; data: WishlistSummary }> {
    if (this.isInWishlist(productId)) {
      return this.removeItem(productId);
    } else {
      return this.addItem(productId);
    }
  }

  addItem(productId: string): Observable<{ success: boolean; data: WishlistSummary }> {
    return this.http
      .post<{ success: boolean; data: WishlistSummary }>(`${this.apiUrl}/items`, { product_id: productId })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.wishlist.set(res.data);
          }
        })
      );
  }

  removeItem(productId: string): Observable<{ success: boolean; data: WishlistSummary }> {
    return this.http
      .delete<{ success: boolean; data: WishlistSummary }>(`${this.apiUrl}/items/${productId}`)
      .pipe(
        tap((res) => {
          if (res.success) {
            this.wishlist.set(res.data);
          }
        })
      );
  }

  isInWishlist(productId: string): boolean {
    const list = this.wishlist();
    if (!list || !list.items) return false;
    return list.items.some((item) => item.productId === productId);
  }
}
