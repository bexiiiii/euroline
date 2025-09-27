import { apiFetch } from '../api';

export interface ProductProperty {
  propertyName: string;
  propertyValue: string;
}

export interface ProductWarehouse {
  name: string;
  quantity: number;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  description: string;
  brand: string;
  externalCode: string;
  imageUrl: string;
  properties: ProductProperty[];
  syncedWith1C: boolean;
  // Данные из 1С
  price?: number;
  stock?: number;
  warehouses?: ProductWarehouse[];
  // Weekly
  weekly?: boolean;
  weeklyStartAt?: string;
  weeklyEndAt?: string;
}

export interface ProductRequest {
  name: string;
  code: string;
  description: string;
  brand: string;
  externalCode: string;
  imageUrl: string;
  properties: ProductProperty[];
}

export interface ProductFilters {
  q?: string; // для поиска
}

export const productApi = {
  /**
   * Get all products
   */
  getProducts: async (): Promise<Product[]> => {
    return apiFetch<Product[]>('/api/admin/products/all');
  },

  /**
   * Search products
   */
  searchProducts: async (query: string): Promise<Product[]> => {
    return apiFetch<Product[]>(`/api/admin/products/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get a specific product by ID
   */
  getProductById: async (productId: number): Promise<Product> => {
    return apiFetch<Product>(`/api/admin/products/${productId}`);
  },

  /**
   * Create a new product
   */
  createProduct: async (productData: ProductRequest): Promise<Product> => {
    return apiFetch<Product>('/api/admin/products/create', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  /**
   * Update product information
   */
  updateProduct: async (productId: number, productData: ProductRequest): Promise<Product> => {
    return apiFetch<Product>(`/api/admin/products/update/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  /**
   * Delete a product
   */
  deleteProduct: async (productId: number): Promise<void> => {
    return apiFetch<void>(`/api/admin/products/${productId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle or set weekly state for product
   */
  setWeekly: async (
    productId: number,
    body: { value?: boolean; startAt?: string; endAt?: string; autoRange?: boolean }
  ): Promise<Product> => {
    return apiFetch<Product>(`/api/admin/products/${productId}/weekly`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
