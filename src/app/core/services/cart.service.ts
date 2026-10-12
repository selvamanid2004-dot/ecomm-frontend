import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartSummary } from '../models/ecommerce.models';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly apiUrl = `${environment.apiUrl}/cart`;

  cart = signal<CartSummary | null>(null);
  itemCount = computed(() => this.cart()?.itemCount || 0);
  subtotal = computed(() => this.cart()?.subtotal || 0);
  totalAmount = computed(() => this.cart()?.totalAmount || 0);

  constructor(private http: HttpClient) {
    this.refreshCart().subscribe();
  }

  refreshCart(): Observable<{ success: boolean; data: CartSummary }> {
    return this.http.get<{ success: boolean; data: CartSummary }>(this.apiUrl).pipe(
      tap((res) => {
        if (res.success) {
          this.cart.set(res.data);
        }
      })
    );
  }

  addToCart(productId: string, variantId?: string | null, quantity = 1): Observable<{ success: boolean; data: CartSummary }> {
    return this.http
      .post<{ success: boolean; data: CartSummary }>(`${this.apiUrl}/items`, {
        product_id: productId,
        variant_id: variantId || null,
        quantity,
      })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.cart.set(res.data);
          }
        })
      );
  }

  updateQuantity(itemId: string, quantity: number): Observable<{ success: boolean; data: CartSummary }> {
    return this.http
      .put<{ success: boolean; data: CartSummary }>(`${this.apiUrl}/items/${itemId}`, { quantity })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.cart.set(res.data);
          }
        })
      );
  }

  removeItem(itemId: string): Observable<{ success: boolean; data: CartSummary }> {
    return this.http.delete<{ success: boolean; data: CartSummary }>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap((res) => {
        if (res.success) {
          this.cart.set(res.data);
        }
      })
    );
  }

  applyCoupon(couponCode: string): Observable<{ success: boolean; data: CartSummary }> {
    return this.http
      .post<{ success: boolean; data: CartSummary }>(`${this.apiUrl}/apply-coupon`, { coupon_code: couponCode })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.cart.set(res.data);
          }
        })
      );
  }

  removeCoupon(): Observable<{ success: boolean; data: CartSummary }> {
    return this.http.delete<{ success: boolean; data: CartSummary }>(`${this.apiUrl}/coupon`).pipe(
      tap((res) => {
        if (res.success) {
          this.cart.set(res.data);
        }
      })
    );
  }
}
