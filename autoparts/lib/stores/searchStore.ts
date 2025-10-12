import { create } from 'zustand';
import { searchApi, SearchResponse, SearchItem, SearchVehicle, SearchApiError, OemApplicableVehicle, OemApplicabilityResponse } from '@/lib/api/search';
import { toast } from 'sonner';

interface SearchState {
  query: string;
  detectedType: 'VIN' | 'FRAME' | 'OEM' | 'TEXT' | 'PLATE' | null;
  vehicle: SearchVehicle | null;
  results: SearchItem[];
  isLoading: boolean;
  error: string | null;
  // client-side filters (UI)
  filters: {
    brands: string[];
    photoOnly: boolean;
  };
  page: number;
  pageSize: number;
  
  search: (query: string, catalog?: string) => Promise<SearchResponse | null>;
  setQuery: (query: string) => void;
  clearResults: () => void;
  clearError: () => void;
  // filters actions
  toggleBrand: (brand: string) => void;
  clearBrands: () => void;
  setPhotoOnly: (v: boolean) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // OEM multi-step flow
  oemStep: 'catalog' | 'vehicles' | 'details' | null;
  selectedCatalog: { brand: string; catalog: string } | null;
  applicableVehicles: OemApplicableVehicle[];
  setSelectedCatalog: (pair: { brand: string; catalog: string } | null) => void;
  loadOemApplicableVehicles: (catalog: string, oem: string, brand?: string) => Promise<void>;
  loadOemApplicability: (catalog: string, ssd: string, oem: string, brand?: string) => Promise<void>;
  resetOemFlow: () => void;
}

export const useSearchStore = create<SearchState>()((set, get) => ({
  query: '',
  isLoading: false,
  error: null,
  detectedType: null,
  vehicle: null,
  results: [],
  filters: { brands: [], photoOnly: false },
  page: 0,
  pageSize: 20,
  oemStep: null,
  selectedCatalog: null,
  applicableVehicles: [],

  search: async (query: string, catalog?: string): Promise<SearchResponse | null> => {
    if (!query.trim()) {
      toast.error('Введите запрос для поиска');
      return null;
    }

    // Minimum 3 characters for search
    if (query.trim().length < 3) {
      toast.error('Введите не менее 3 символов для поиска');
      return null;
    }

    set({ 
      isLoading: true, 
      error: null, 
      query: query.trim(),
      vehicle: null,
      results: [],
      // reset OEM flow on new search
      oemStep: null,
      selectedCatalog: null,
      applicableVehicles: [],
      // keep filters but clear brands that no longer relevant later if needed
      page: 0,
    });

    try {
      const response = await searchApi.search(query.trim(), catalog);
      
      const newResults = response.results || []
      // cleanup selected brands that are not present in new results
      const presentBrands = new Set(newResults.map(r => r.brand).filter(Boolean))
      const currentFilters = get().filters
      const cleanedBrands = currentFilters.brands.filter(b => presentBrands.has(b))

      set({
        detectedType: response.detectedType || null,
        vehicle: response.vehicle || null,
        results: newResults,
        isLoading: false,
        error: null,
        filters: { ...currentFilters, brands: cleanedBrands },
      });

      // Показываем информацию о типе поиска
      if (response.detectedType === 'VIN' && response.vehicle) {
        toast.success(`Найден автомобиль: ${response.vehicle.brand} ${response.vehicle.name}`);
      } else if (response.detectedType === 'FRAME' && response.vehicle) {
        toast.success(`Найден автомобиль по номеру кузова: ${response.vehicle.brand} ${response.vehicle.name}`);
      } else if (response.detectedType === 'PLATE' && response.vehicle) {
        toast.success(`Найден автомобиль по номеру гос. знака: ${response.vehicle.brand} ${response.vehicle.name}`);
      } else if (response.results && response.results.length > 0) {
        toast.success(`Найдено ${response.results.length} запчастей`);
      } else {
        toast.info('По вашему запросу ничего не найдено');
      }

      return response;

    } catch (error) {
      console.error('Search failed:', error);
      const errorMessage = error instanceof SearchApiError ? error.message : 'Ошибка поиска';
      
      set({ 
        error: errorMessage, 
        isLoading: false,
        results: [],
        vehicle: null
      });
      
      toast.error(errorMessage);
      return null;
    }
  },

  setQuery: (query: string) => {
    set({ query });
  },

  clearResults: () => {
    set({ 
      results: [], 
      vehicle: null, 
      detectedType: null, 
      error: null,
      page: 0,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  // ===== Filters =====
  toggleBrand: (brand: string) => {
    const brands = new Set(get().filters.brands);
    if (brands.has(brand)) brands.delete(brand); else brands.add(brand);
    set({ filters: { ...get().filters, brands: Array.from(brands) }, page: 0 });
  },
  clearBrands: () => set({ filters: { ...get().filters, brands: [] }, page: 0 }),
  setPhotoOnly: (v: boolean) => set({ filters: { ...get().filters, photoOnly: v }, page: 0 }),
  resetFilters: () => set({ filters: { brands: [], photoOnly: false }, page: 0 }),
  setPage: (page: number) => {
    const safePage = Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0;
    const { results, pageSize } = get();
    const maxPage = Math.max(0, Math.ceil((results?.length || 0) / pageSize) - 1);
    set({ page: Math.min(safePage, maxPage) });
  },
  setPageSize: (size: number) => {
    const fallback = 20;
    const nextSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : fallback;
    set({ pageSize: nextSize, page: 0 });
  },

  // ===== OEM flow =====
  setSelectedCatalog: (pair) => {
    set({ selectedCatalog: pair, oemStep: pair ? 'vehicles' : 'catalog', applicableVehicles: [], results: [], page: 0 });
  },

  loadOemApplicableVehicles: async (catalog: string, oem: string, brand?: string) => {
    try {
      set({ isLoading: true, error: null });
      const vehicles = await searchApi.getApplicableVehicles(catalog, oem);
      set({ applicableVehicles: vehicles, isLoading: false, oemStep: 'vehicles', selectedCatalog: { brand: brand || '', catalog }, page: 0 });
    } catch (error) {
      const message = error instanceof SearchApiError ? error.message : 'Не удалось загрузить применимость (авто)';
      set({ error: message, isLoading: false });
    }
  },

  loadOemApplicability: async (catalog: string, ssd: string, oem: string, brand?: string) => {
    try {
      set({ isLoading: true, error: null });
      const resp: OemApplicabilityResponse = await searchApi.getApplicability(catalog, ssd, oem);

      // Преобразуем детали в SearchItem[], чтобы отобразить текущей таблицей
      const items: SearchItem[] = [];
      for (const cat of resp.categories || []) {
        for (const unit of cat.units || []) {
          for (const d of unit.details || []) {
            const qty = d.attrs && d.attrs['amount'] ? parseInt(d.attrs['amount']) : undefined;
            items.push({
              oem: d.oem || oem,
              name: d.name,
              brand: brand || '',
              catalog,
              imageUrl: unit.imageUrl,
              quantity: qty,
              unitId: unit.unitId,
              ssd,
              categoryId: cat.categoryId,
              vehicleHints: [],
            });
          }
        }
      }

      set({ results: items, isLoading: false, oemStep: 'details', page: 0 });
    } catch (error) {
      const message = error instanceof SearchApiError ? error.message : 'Не удалось загрузить детали применимости';
      set({ error: message, isLoading: false });
    }
  },

  resetOemFlow: () => set({ oemStep: null, selectedCatalog: null, applicableVehicles: [], results: [], page: 0 }),
}));
