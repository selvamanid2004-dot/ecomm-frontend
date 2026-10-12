import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  let token: string | null = null;

  // Use appropriate token based on whether request targets admin portal or customer storefront
  if (req.url.includes('/admin')) {
    token = authService.getAdminToken() || authService.getCustomerToken();
  } else {
    token = authService.getCustomerToken() || authService.getAdminToken();
  }

  let sessionId = localStorage.getItem('luxe_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('luxe_session_id', sessionId);
  }

  let headers = req.headers.set('X-Session-ID', sessionId);
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const customer = authService.currentCustomer();
  if (customer && !req.url.includes('/admin')) {
    if ((customer as any).customerId || customer.id) {
      headers = headers.set('X-Customer-Id', (customer as any).customerId || customer.id);
    }
    if (customer.email) {
      headers = headers.set('X-Customer-Email', customer.email);
    }
  }

  const cloned = req.clone({ headers });
  return next(cloned);
};
