export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  trialEndDate?: string;
  subscriptionStatus?: 'trial' | 'premium' | 'expired';
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  sku: string;
  imageUrl?: string;
  images?: string[];
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  items: SaleItem[];
  total: number;
  discount: number;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'credit';
  createdAt: string;
  createdBy: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  credit: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  userId: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'stock-alert' | 'sale' | 'info';
  read: boolean;
  createdAt: string;
  userId: string;
}
