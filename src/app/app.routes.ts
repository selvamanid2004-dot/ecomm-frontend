import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // 1. Single Page Boutique Experience (Single Page Only)
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/single-store/single-store.component').then(
        (m) => m.SingleStoreComponent
      ),
  },

  // 2. Direct Admin Login (Not linked anywhere on frontend)
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },

  // 3. Admin Portal Routes (Accessible exclusively via direct URL)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/admin-products.component').then(
            (m) => m.AdminProductsComponent
          ),
      },
      {
        path: 'add-product',
        loadComponent: () =>
          import('./features/admin/admin-add-product.component').then(
            (m) => m.AdminAddProductComponent
          ),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./features/admin/admin-pricing.component').then(
            (m) => m.AdminPricingComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/admin-orders.component').then(
            (m) => m.AdminOrdersComponent
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/admin/admin-customers.component').then(
            (m) => m.AdminCustomersComponent
          ),
      },
      {
        path: 'content',
        loadComponent: () =>
          import('./features/admin/admin-content.component').then(
            (m) => m.AdminContentComponent
          ),
      },
    ],
  },

  // Fallback Wildcard - Redirect everything else to the single storefront page
  {
    path: '**',
    redirectTo: '',
  },
];
