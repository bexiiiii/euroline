import { API_BASE } from './base';
import { PaginatedResponse } from './types';

export interface ProductPropertyDTO {
  propertyName: string;
  propertyValue: string;
}

export interface ProductWarehouseDTO {
  name: string;
  quantity: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  code: string;
  description?: string;
  brand?: string;
  externalCode?: string;
  imageUrl?: string;
  properties?: ProductPropertyDTO[];
  syncedWith1C?: boolean;
  price?: number;
  stock?: number;
  warehouses?: ProductWarehouseDTO[];
}

export interface WeeklyProductsFilters {
  q?: string;
  brands?: string[];
  inStock?: boolean;
  priceFrom?: number;
  priceTo?: number;
  sort?: string; // e.g. 'price,asc' | 'id,desc'
}

export interface CategoryProductsFilters {
  q?: string;
  brands?: string[];
  inStock?: boolean;
  priceFrom?: number;
  priceTo?: number;
  sort?: string; // e.g. 'price,asc' | 'id,desc'
}

export async function getWeeklyProducts(
  page = 0,
  size = 12,
  filters: WeeklyProductsFilters = {}
): Promise<PaginatedResponse<ProductResponse>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (filters.q) params.set('q', filters.q);
  if (filters.inStock !== undefined) params.set('inStock', String(filters.inStock));
  if (filters.priceFrom !== undefined) params.set('priceFrom', String(filters.priceFrom));
  if (filters.priceTo !== undefined) params.set('priceTo', String(filters.priceTo));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.brands && filters.brands.length) {
    for (const b of filters.brands) params.append('brands', b);
  }

  const url = `${API_BASE}/api/products/weekly?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load weekly products: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getProductsByCategory(
  categoryId: number,
  page = 0,
  size = 12,
  filters: CategoryProductsFilters = {}
): Promise<PaginatedResponse<ProductResponse>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  
  if (filters.q) params.set('q', filters.q);
  if (filters.inStock !== undefined) params.set('inStock', String(filters.inStock));
  if (filters.priceFrom !== undefined) params.set('priceFrom', String(filters.priceFrom));
  if (filters.priceTo !== undefined) params.set('priceTo', String(filters.priceTo));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.brands && filters.brands.length) {
    for (const b of filters.brands) params.append('brands', b);
  }

  const url = `${API_BASE}/api/products/by-category/${categoryId}?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load category products: ${res.status} ${text}`);
  }
  return res.json();
}

export function resolveProductImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl || !imageUrl.trim()) return undefined;
  return imageUrl.startsWith('http') ? imageUrl : `${API_BASE}${imageUrl}`;
}

export async function getProductByIdentifier(identifier: string | number): Promise<ProductResponse> {
  const value = typeof identifier === 'number' ? String(identifier) : identifier;
  const encoded = encodeURIComponent(value);
  const res = await fetch(`${API_BASE}/api/products/${encoded}`, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load product ${value}: ${res.status} ${text}`);
  }
  return res.json();
}
