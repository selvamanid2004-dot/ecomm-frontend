import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminMetrics, Product, Order } from '../models/ecommerce.models';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;
  private cache = new Map<string, CacheEntry<any>>();

  constructor(private http: HttpClient) {}

  /**
   * Clear in-memory cache for specific keys or all keys
   */
  clearCache(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  getMetrics(forceRefresh = false): Observable<{ success: boolean; data: AdminMetrics }> {
    const key = 'metrics';
    const cached = this.cache.get(key);
    if (!forceRefresh && cached && cached.expiry > Date.now()) {
      return of(cached.data);
    }
    return this.http
      .get<{ success: boolean; data: AdminMetrics }>(`${this.apiUrl}/dashboard/metrics`)
      .pipe(
        tap((res) => {
          if (res.success) {
            this.cache.set(key, { data: res, expiry: Date.now() + 15000 }); // 15s cache
          }
        })
      );
  }

  getProducts(params?: any, forceRefresh = false): Observable<{ success: boolean; data: Product[]; meta: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    const key = `products_${httpParams.toString()}`;
    const cached = this.cache.get(key);
    if (!forceRefresh && cached && cached.expiry > Date.now()) {
      return of(cached.data);
    }
    return this.http
      .get<{ success: boolean; data: Product[]; meta: any }>(`${this.apiUrl}/products`, {
        params: httpParams,
      })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.cache.set(key, { data: res, expiry: Date.now() + 20000 }); // 20s cache
          }
        })
      );
  }

  createProduct(data: any): Observable<{ success: boolean; data: Product }> {
    this.clearCache('products');
    this.clearCache('metrics');
    return this.http.post<{ success: boolean; data: Product }>(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: string, data: any): Observable<{ success: boolean; data: Product }> {
    this.clearCache('products');
    this.clearCache('metrics');
    return this.http.put<{ success: boolean; data: Product }>(`${this.apiUrl}/products/${id}`, data);
  }

  uploadImage(file: File): Observable<{ success: boolean; data: { url: string; relativeUrl: string; filename: string } }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ success: boolean; data: { url: string; relativeUrl: string; filename: string } }>(
      `${this.apiUrl}/upload`,
      formData
    );
  }

  deleteProduct(id: string): Observable<{ success: boolean; message: string }> {
    this.clearCache('products');
    this.clearCache('metrics');
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/products/${id}`);
  }

  toggleProductStatus(id: string): Observable<{ success: boolean; message: string; data: Product }> {
    this.clearCache('products');
    this.clearCache('metrics');
    return this.http.post<{ success: boolean; message: string; data: Product }>(
      `${this.apiUrl}/products/${id}/toggle-status`,
      {}
    );
  }

  // Dynamic Price Management & Audit Trail
  updatePrice(
    productId: string,
    basePrice: number,
    compareAtPrice: number | null,
    reason: string
  ): Observable<{ success: boolean; data: any }> {
    this.clearCache('products');
    this.clearCache('price_history');
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/products/${productId}/pricing`, {
      base_price: basePrice,
      compare_at_price: compareAtPrice,
      reason,
    });
  }

  getPriceHistory(productId: string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/products/${productId}/price-history`);
  }

  // Inventory Management & Stock Adjustments
  adjustStock(
    productId: string,
    changeQuantity: number,
    type: string,
    notes?: string
  ): Observable<{ success: boolean; data: any }> {
    this.clearCache('products');
    this.clearCache('metrics');
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/products/${productId}/inventory`, {
      change_quantity: changeQuantity,
      type,
      notes,
    });
  }

  getStockHistory(productId: string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/products/${productId}/inventory-history`);
  }

  getLowStockAlerts(): Observable<{ success: boolean; data: Product[] }> {
    return this.http.get<{ success: boolean; data: Product[] }>(`${this.apiUrl}/inventory/low-stock`);
  }

  // Orders Management
  getOrders(params?: any, forceRefresh = false): Observable<{ success: boolean; data: Order[]; meta: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    const key = `orders_${httpParams.toString()}`;
    const cached = this.cache.get(key);
    if (!forceRefresh && cached && cached.expiry > Date.now()) {
      return of(cached.data);
    }
    return this.http
      .get<{ success: boolean; data: Order[]; meta: any }>(`${this.apiUrl}/orders`, {
        params: httpParams,
      })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.cache.set(key, { data: res, expiry: Date.now() + 15000 }); // 15s cache
          }
        })
      );
  }

  getOrder(id: string): Observable<{ success: boolean; data: Order }> {
    return this.http.get<{ success: boolean; data: Order }>(`${this.apiUrl}/orders/${id}`);
  }

  updateOrderStatus(
    orderId: string,
    status: string,
    paymentStatus?: string,
    trackingNumber?: string,
    comments?: string
  ): Observable<{ success: boolean; data: Order }> {
    this.clearCache('orders');
    this.clearCache('metrics');
    return this.http.put<{ success: boolean; data: Order }>(`${this.apiUrl}/orders/${orderId}/status`, {
      status,
      payment_status: paymentStatus,
      tracking_number: trackingNumber,
      comments,
    });
  }

  deleteOrder(orderId: string): Observable<{ success: boolean; message: string }> {
    this.clearCache('orders');
    this.clearCache('metrics');
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/orders/${orderId}`);
  }

  // Customers Management
  getCustomers(params?: any, forceRefresh = false): Observable<{ success: boolean; data: any[]; meta: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    const key = `customers_${httpParams.toString()}`;
    const cached = this.cache.get(key);
    if (!forceRefresh && cached && cached.expiry > Date.now()) {
      return of(cached.data);
    }
    return this.http
      .get<{ success: boolean; data: any[]; meta: any }>(`${this.apiUrl}/customers`, {
        params: httpParams,
      })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.cache.set(key, { data: res, expiry: Date.now() + 30000 }); // 30s cache
          }
        })
      );
  }

  deleteCustomer(customerId: string): Observable<{ success: boolean; message: string }> {
    this.clearCache('customers');
    this.clearCache('metrics');
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/customers/${customerId}`);
  }
}
