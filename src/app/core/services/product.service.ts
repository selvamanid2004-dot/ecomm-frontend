import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, Category } from '../models/ecommerce.models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private readonly catUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    in_stock?: string;
  }): Observable<{ success: boolean; data: Product[]; meta: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        const val = (params as any)[key];
        if (val !== undefined && val !== null && val !== '') {
          httpParams = httpParams.set(key, val.toString());
        }
      });
    }

    return this.http.get<{ success: boolean; data: Product[]; meta: any }>(this.apiUrl, {
      params: httpParams,
    });
  }

  getFeatured(): Observable<{ success: boolean; data: Product[] }> {
    return this.http.get<{ success: boolean; data: Product[] }>(`${this.apiUrl}/featured`);
  }

  getProduct(identifier: string): Observable<{ success: boolean; data: Product }> {
    return this.http.get<{ success: boolean; data: Product }>(`${this.apiUrl}/${identifier}`);
  }

  getRelated(categoryId: string, excludeId: string): Observable<{ success: boolean; data: Product[] }> {
    const params = new HttpParams().set('categoryId', categoryId).set('excludeId', excludeId);
    return this.http.get<{ success: boolean; data: Product[] }>(`${this.apiUrl}/related`, { params });
  }

  getCategories(): Observable<{ success: boolean; data: Category[] }> {
    return this.http.get<{ success: boolean; data: Category[] }>(this.catUrl);
  }

  createProduct(data: any): Observable<{ success: boolean; data: Product }> {
    return this.http.post<{ success: boolean; data: Product }>(this.apiUrl, data);
  }
}

