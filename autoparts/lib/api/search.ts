export interface SearchResponse {
  query: string;
  detectedType: 'VIN' | 'FRAME' | 'PLATE' | 'OEM' | 'TEXT';
  vehicle?: SearchVehicle;
  results?: SearchItem[];
}

export interface SearchVehicle {
  vehicleId: string;
  ssd: string;
  catalog: string;
  brand: string;
  name: string;
}

export interface SearchItem {
  oem: string;
  name: string;
  brand: string;
  catalog: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  warehouses?: SearchWarehouse[];
  unitId?: number;
  ssd?: string;
  categoryId?: number;
  vehicleHints?: string[];
  
  // UMAPI enrichment fields
  umapiSuppliers?: UmapiSupplier[];      // список брендов из UMAPI
  analogsCount?: number;                  // количество доступных аналогов
  oeNumbers?: string[];                   // OE коды
  tradeNumbers?: string[];                // торговые номера
  eanNumbers?: string[];                  // EAN штрихкоды
  criteria?: TechnicalCriteria[];         // технические характеристики
  umapiImages?: string[];                 // изображения из UMAPI
}

export interface UmapiSupplier {
  id: number;
  name: string;
  matchType: string;        // EXACT, OE, SIMILAR
  articleCount: number;
}

export interface TechnicalCriteria {
  id: number;
  name: string;
  value: string;
  unit?: string;
}

export interface SearchWarehouse {
  code: string;
  name: string;
  address: string;
  qty: number;
}

const API_BASE_URL = `${API_BASE}/api`;

class SearchApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SearchApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedEndpoint = `/${endpoint.replace(/^\/+/, '')}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('authToken');
  if (token && token.trim() !== '') {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new SearchApiError(response.status, errorMessage || 'Network error');
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  } catch (error) {
    if (error instanceof SearchApiError) {
      throw error;
    }
    throw new SearchApiError(0, 'Network error');
  }
}

export const searchApi = {
  // Основной поиск
  async search(query: string, catalog?: string): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (catalog) {
      params.append('catalog', catalog);
    }

    return apiRequest<SearchResponse>(`/search?${params.toString()}`);
  },
  
  // OEM: применимые автомобили по выбранному каталогу и артикулу
  async getApplicableVehicles(catalog: string, oem: string): Promise<OemApplicableVehicle[]> {
    const params = new URLSearchParams({ catalog, oem });
    return apiRequest<OemApplicableVehicle[]>(`/v1/search/oem/applicable-vehicles?${params.toString()}`);
  },

  // OEM: применимость (категории/узлы/детали)
  async getApplicability(catalog: string, ssd: string, oem: string): Promise<OemApplicabilityResponse> {
    const params = new URLSearchParams({ catalog, ssd, oem });
    return apiRequest<OemApplicabilityResponse>(`/v1/search/oem/applicability?${params.toString()}`);
  },
  
  // UMAPI: поиск по артикулу (уточнение бренда)
  async searchByArticle(article: string): Promise<BrandRefinementResponse> {
    const params = new URLSearchParams({ article });
    return apiRequest<BrandRefinementResponse>(`/parts-search/by-article?${params.toString()}`);
  },
};

export { SearchApiError };

// ===== Types for OEM flow =====
export interface OemApplicableVehicle {
  brand: string;
  catalog: string;
  name: string;
  ssd: string;
  vehicleId?: string;
  attributes?: Record<string, string>;
}

export interface OemApplicabilityDetail {
  oem: string;
  name: string;
  codeOnImage?: string;
  attrs?: Record<string, string>;
}

export interface OemApplicabilityUnit {
  unitId: number;
  code: string;
  name: string;
  imageUrl?: string;
  details: OemApplicabilityDetail[];
}

export interface OemApplicabilityCategory {
  categoryId: number;
  name: string;
  ssd: string;
  units: OemApplicabilityUnit[];
}

export interface OemApplicabilityResponse {
  categories: OemApplicabilityCategory[];
}

// ===== UMAPI Types =====

// BrandRefinement response - теперь это просто массив
export type BrandRefinementResponse = BrandRefinementItem[];

export interface BrandRefinementItem {
  article: string;
  articleSearch: string;
  title: string;
  img: string | null;
  artId: number | null;
  type: string;        // "Indefinite", "OEM", "OES"
  target: string;      // "Cross", "Original"
  brand: string;
  brandSearch: string;
}

import { API_BASE } from './base';
