export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'customer';
  phone?: string;
  avatar_url?: string;
  customerId?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
  productCount?: number;
}

export interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  option1_name?: string;
  option1_value?: string;
  price_override?: number;
  stock_quantity: number;
}

export interface ProductReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  short_description?: string;
  category_id?: string;
  base_price: number;
  compare_at_price?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  is_in_stock: boolean;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews?: ProductReview[];
}

export interface CartItemSummary {
  id: string;
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  image: string;
  variantTitle?: string;
  variantId?: string;
  quantity: number;
  stockAvailable: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartSummary {
  cartId: string;
  sessionId?: string;
  couponCode?: string | null;
  items: CartItemSummary[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
}

export interface WishlistItemSummary {
  id: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  isInStock: boolean;
  image: string;
  categoryName?: string;
  addedAt: string;
}

export interface WishlistSummary {
  wishlistId: string;
  items: WishlistItemSummary[];
  count: number;
}

export interface OrderItem {
  id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  product_image_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'failed';
  payment_method: string;
  shipping_method: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_fee: number;
  total_amount: number;
  shipping_address_json: any;
  billing_address_json?: any;
  customer_id?: string;
  guest_email?: string;
  tracking_number?: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
}

export interface AdminMetrics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    lowStockProducts: number;
    totalCustomers: number;
  };
  recentOrders: any[];
  recentPriceChanges: any[];
}
