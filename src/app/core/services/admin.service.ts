import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminMetrics, Product, Order } from '../models/ecommerce.models';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<{ success: boolean; data: AdminMetrics }> {
    return this.http.get<{ success: boolean; data: AdminMetrics }>(`${this.apiUrl}/dashboard/metrics`);
  }

  getProducts(params?: any): Observable<{ success: boolean; data: Product[]; meta: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<{ success: boolean; data: Product[]; meta: any }>(`${this.apiUrl}/products`, {
      params: httpParams,
    });
  }

  createProduct(data: any): Observable<{ success: boolean; data: Product }> {
    return this.http.post<{ success: boolean; data: Product }>(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: string, data: any): Observable<{ success: boolean; data: Product }> {
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
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/products/${id}`);
  }

  toggleProductStatus(id: string): Observable<{ success: boolean; message: string; data: Product }> {
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
  getOrders(params?: any): Observable<{ success: boolean; data: Order[]; meta: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<{ success: boolean; data: Order[]; meta: any }>(`${this.apiUrl}/orders`, {
      params: httpParams,
    });
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
    return this.http.put<{ success: boolean; data: Order }>(`${this.apiUrl}/orders/${orderId}/status`, {
      status,
      payment_status: paymentStatus,
      tracking_number: trackingNumber,
      comments,
    });
  }

  deleteOrder(orderId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/orders/${orderId}`);
  }

  // Customers Management
  getCustomers(params?: any): Observable<{ success: boolean; data: any[]; meta: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<{ success: boolean; data: any[]; meta: any }>(`${this.apiUrl}/customers`, {
      params: httpParams,
    });
  }

  deleteCustomer(customerId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/customers/${customerId}`);
  }
}
