import { apiFetch } from '../api';
import { PageResponse } from './types';

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  price: number;
  totalPrice: number;
  addedAt: string;
}

export interface CustomerCart {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  lastUpdated: string;
  createdAt: string;
  isAbandoned: boolean;
  abandonedAt?: string;
}

export interface CartStats {
  totalActiveCarts: number;
  totalAbandonedCarts: number;
  averageCartValue: number;
  totalCartValue: number;
  cartConversionRate: number;
  mostAddedProducts: {
    productId: number;
    productName: string;
    addedCount: number;
  }[];
}

const BASE_URL = 'http://localhost:8080/api/admin';

export const cartsApi = {
  getCarts: async (page = 0, size = 10, sort = 'lastUpdated,desc', status?: 'ACTIVE' | 'ABANDONED'): Promise<PageResponse<CustomerCart>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    });
    
    if (status) {
      params.append('status', status);
    }

    return apiFetch<PageResponse<CustomerCart>>(`${BASE_URL}/carts?${params}`);
  },

  getCart: async (id: number): Promise<CustomerCart> => {
    return apiFetch<CustomerCart>(`${BASE_URL}/carts/${id}`);
  },

  getAbandonedCarts: async (page = 0, size = 10, days = 7): Promise<PageResponse<CustomerCart>> => {
    return apiFetch<PageResponse<CustomerCart>>(`${BASE_URL}/carts/abandoned?page=${page}&size=${size}&days=${days}`);
  },

  getCartStats: async (days = 30): Promise<CartStats> => {
    return apiFetch<CartStats>(`${BASE_URL}/carts/stats?days=${days}`);
  },

  getCustomerCarts: async (customerId: number): Promise<CustomerCart[]> => {
    return apiFetch<CustomerCart[]>(`${BASE_URL}/carts/customer/${customerId}`);
  },

  clearCart: async (id: number): Promise<void> => {
    return apiFetch<void>(`${BASE_URL}/carts/${id}/clear`, {
      method: 'DELETE',
    });
  },

  removeCartItem: async (cartId: number, itemId: number): Promise<CustomerCart> => {
    return apiFetch<CustomerCart>(`${BASE_URL}/carts/${cartId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  updateCartItem: async (cartId: number, itemId: number, quantity: number): Promise<CustomerCart> => {
    return apiFetch<CustomerCart>(`${BASE_URL}/carts/${cartId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  sendAbandonedCartEmail: async (cartId: number): Promise<void> => {
    return apiFetch<void>(`${BASE_URL}/carts/${cartId}/send-reminder`, {
      method: 'POST',
    });
  },

  convertCartToOrder: async (cartId: number): Promise<{ orderId: number }> => {
    return apiFetch<{ orderId: number }>(`${BASE_URL}/carts/${cartId}/convert-to-order`, {
      method: 'POST',
    });
  },
};
