import { PageResponse } from './types';
import { apiFetch } from '../api';

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  subcategories?: Category[];
  productCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: number;
  slug: string;
  imageUrl?: string;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
  isActive?: boolean;
}

export const categoriesApi = {
  getCategories: async (page = 0, size = 10, sort = 'sortOrder,asc'): Promise<PageResponse<Category>> => {
    return apiFetch<PageResponse<Category>>(`/api/admin/categories?page=${page}&size=${size}&sort=${sort}`);
  },

  getCategory: async (id: number): Promise<Category> => {
    return apiFetch<Category>(`/api/admin/categories/${id}`);
  },

  getRootCategories: async (): Promise<Category[]> => {
    return apiFetch<Category[]>(`/api/admin/categories/root`);
  },

  getCategoryTree: async (): Promise<Category[]> => {
    return apiFetch<Category[]>(`/api/admin/categories/tree`);
  },

  createCategory: async (request: CreateCategoryRequest): Promise<Category> => {
    return apiFetch<Category>(`/api/admin/categories`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  updateCategory: async (id: number, request: UpdateCategoryRequest): Promise<Category> => {
    return apiFetch<Category>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  deleteCategory: async (id: number): Promise<void> => {
    return apiFetch<void>(`/api/admin/categories/${id}`, { method: 'DELETE' });
  },

  updateCategoryOrder: async (categoryIds: number[]): Promise<void> => {
    return apiFetch<void>(`/api/admin/categories/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ categoryIds }),
    });
  },

  toggleCategoryStatus: async (id: number): Promise<Category> => {
    return apiFetch<Category>(`/api/admin/categories/${id}/toggle-status`, { method: 'PATCH' });
  },
};
