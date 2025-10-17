import { apiFetch } from '../api';
import { PageResponse } from './types';
import type { Category } from './categories';

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
  price?: number;
  stock?: number;
  warehouses?: ProductWarehouse[];
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
  q?: string;
  brand?: string;
  category?: string;
  page?: number;
  size?: number;
  sort?: string;
}

const DEFAULT_PAGE_SIZE = 20;

const normalizeQuery = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
};

const filterProducts = (products: Product[], filters: ProductFilters): Product[] => {
  const query = normalizeQuery(filters.q);
  const brand = normalizeQuery(filters.brand);

  return products.filter((product) => {
    if (query) {
      const haystack = [
        product.name,
        product.code,
        product.description,
        product.brand,
      ]
        .filter(Boolean)
        .map((part) => part!.toLowerCase());

      const hasMatch = haystack.some((part) => part.includes(query));
      if (!hasMatch) {
        return false;
      }
    }

    if (brand) {
      const productBrand = normalizeQuery(product.brand);
      if (!productBrand || productBrand !== brand) {
        return false;
      }
    }

    // category filter can be implemented once backend exposes category data per product
    return true;
  });
};

const getComparableValue = (product: Product, field?: string): string | number => {
  switch (field) {
    case 'brand':
      return product.brand?.toLowerCase() ?? '';
    case 'price':
      return product.price ?? 0;
    case 'stock':
      return product.stock ?? 0;
    case 'code':
      return product.code?.toLowerCase() ?? '';
    default:
      return product.name?.toLowerCase() ?? '';
  }
};

const sortProducts = (products: Product[], sort?: string): Product[] => {
  if (!sort) return products;

  const [field, direction] = sort.split(',');
  const multiplier = direction?.toLowerCase() === 'desc' ? -1 : 1;

  return [...products].sort((a, b) => {
    const aValue = getComparableValue(a, field);
    const bValue = getComparableValue(b, field);

    if (aValue < bValue) return -1 * multiplier;
    if (aValue > bValue) return 1 * multiplier;
    return 0;
  });
};

const clampPage = (page?: number): number => {
  if (page === undefined || Number.isNaN(page) || page < 0) {
    return 0;
  }
  return Math.floor(page);
};

const normalizePageSize = (size?: number): number => {
  if (!size || Number.isNaN(size) || size <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.floor(size);
};

// ✅ Всегда возвращаем PageResponse для оптимальной производительности
async function fetchProducts(filters?: ProductFilters): Promise<PageResponse<Product>> {
  const page = clampPage(filters?.page);
  const size = normalizePageSize(filters?.size);
  
  // Backend возвращает Page<Product>
  const pageResponse = await apiFetch<PageResponse<Product>>(
    `/api/admin/products/all?page=${page}&size=${size}`
  );

  // Применяем дополнительные фильтры на клиенте (если нужно)
  let filtered = pageResponse.content;
  if (filters?.q || filters?.brand) {
    filtered = filterProducts(pageResponse.content, filters);
  }

  // Применяем сортировку на клиенте (если нужно)
  if (filters?.sort) {
    filtered = sortProducts(filtered, filters.sort);
  }

  return {
    content: filtered,
    totalElements: pageResponse.totalElements,
    totalPages: pageResponse.totalPages,
    size: pageResponse.size,
    number: pageResponse.number,
  };
}

const uploadSingleFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiFetch<{ url?: string; id?: string }>(`/api/files/upload`, {
    method: 'POST',
    body: formData,
  });

  if (response?.url) {
    return response.url;
  }
  if (response?.id) {
    return `/api/files/${response.id}`;
  }
  throw new Error('Не удалось загрузить файл');
};

const collectCategoryNames = (items: Category[] = [], acc: string[]): void => {
  for (const item of items) {
    acc.push(item.name);
    if (item.subcategories && item.subcategories.length > 0) {
      collectCategoryNames(item.subcategories, acc);
    }
  }
};

const getCategoryNames = async (): Promise<string[]> => {
  const tree = await apiFetch<Category[]>('/api/admin/categories/tree');
  const names: string[] = [];
  collectCategoryNames(tree, names);
  return names;
};

const getBrandNames = async (): Promise<string[]> => {
  // ✅ Загружаем только первую страницу с большим размером для получения списка брендов
  // TODO: Создать отдельный backend endpoint /api/admin/products/brands для оптимизации
  const pageResponse = await apiFetch<PageResponse<Product>>('/api/admin/products/all?page=0&size=100');
  const brands = new Set<string>();
  for (const product of pageResponse.content) {
    const brand = normalizeQuery(product.brand);
    if (brand) {
      brands.add(brand);
    }
  }
  return Array.from(brands).map((brand) => brand.charAt(0).toUpperCase() + brand.slice(1));
};

export const productApi = {
  getProducts: fetchProducts,

  searchProducts: async (query: string): Promise<Product[]> => {
    return apiFetch<Product[]>(`/api/admin/products/search?q=${encodeURIComponent(query)}`);
  },

  getProductById: async (productId: number): Promise<Product> => {
    return apiFetch<Product>(`/api/admin/products/${productId}`);
  },

  createProduct: async (productData: ProductRequest): Promise<Product> => {
    return apiFetch<Product>('/api/admin/products/create', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (productId: number, productData: ProductRequest | Partial<ProductRequest>): Promise<Product> => {
    return apiFetch<Product>(`/api/admin/products/update/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  deleteProduct: async (productId: number): Promise<void> => {
    return apiFetch<void>(`/api/admin/products/${productId}`, {
      method: 'DELETE',
    });
  },

  setWeekly: async (
    productId: number,
    body: { value?: boolean; startAt?: string; endAt?: string; autoRange?: boolean }
  ): Promise<Product> => {
    return apiFetch<Product>(`/api/admin/products/${productId}/weekly`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  uploadProductImages: async (productId: number, files: File[]): Promise<string[]> => {
    if (!files.length) {
      return [];
    }

    const uploads = await Promise.all(files.map((file) => uploadSingleFile(file)));

    // TODO: integrate uploaded URLs with the product via a dedicated endpoint when available
    return uploads;
  },

  getCategories: getCategoryNames,

  getBrands: getBrandNames,
};
