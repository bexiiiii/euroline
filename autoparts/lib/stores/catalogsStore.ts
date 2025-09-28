import { create } from 'zustand';
import { catalogsApi, CatalogDto, CatalogInfoDto, CatalogsApiError } from '@/lib/api/catalogs';
import { toast } from 'sonner';

interface CatalogsState {
  // Состояние для всех каталогов
  catalogs: CatalogDto[];
  catalogsLoading: boolean;
  catalogsError: string | null;
  
  // Состояние для грузовых каталогов
  truckCatalogs: CatalogDto[];
  truckCatalogsLoading: boolean;
  truckCatalogsError: string | null;
  
  // Состояние для информации о каталоге
  catalogInfo: CatalogInfoDto | null;
  catalogInfoLoading: boolean;
  catalogInfoError: string | null;
  
  // Действия
  fetchCatalogs: () => Promise<void>;
  fetchTruckCatalogs: () => Promise<void>;
  fetchCatalogInfo: (catalogCode: string) => Promise<void>;
  clearErrors: () => void;
  resetState: () => void;
}

export const useCatalogsStore = create<CatalogsState>()((set, get) => ({
  // Начальное состояние
  catalogs: [],
  catalogsLoading: false,
  catalogsError: null,
  
  truckCatalogs: [],
  truckCatalogsLoading: false,
  truckCatalogsError: null,
  
  catalogInfo: null,
  catalogInfoLoading: false,
  catalogInfoError: null,

  // Получить все каталоги
  fetchCatalogs: async () => {
    set({ catalogsLoading: true, catalogsError: null });

    try {
      const catalogs = await catalogsApi.getCatalogs();
      
      set({
        catalogs,
        catalogsLoading: false,
        catalogsError: null
      });

      console.log(`Загружено ${catalogs.length} каталогов`);

    } catch (error) {
      console.error('Ошибка загрузки каталогов:', error);
      const errorMessage = error instanceof CatalogsApiError 
        ? error.message 
        : 'Ошибка загрузки каталогов';
      
      set({ 
        catalogsError: errorMessage, 
        catalogsLoading: false,
        catalogs: []
      });
      
      toast.error(errorMessage);
    }
  },

  // Получить каталоги грузовых автомобилей
  fetchTruckCatalogs: async () => {
    set({ truckCatalogsLoading: true, truckCatalogsError: null });

    try {
      const truckCatalogs = await catalogsApi.getTruckCatalogs();
      
      set({
        truckCatalogs,
        truckCatalogsLoading: false,
        truckCatalogsError: null
      });

      console.log(`Загружено ${truckCatalogs.length} каталогов грузовых автомобилей`);
      
      if (truckCatalogs.length > 0) {
        toast.success(`Найдено ${truckCatalogs.length} брендов грузовых автомобилей`);
      } else {
        toast.info('Каталоги грузовых автомобилей не найдены');
      }

    } catch (error) {
      console.error('Ошибка загрузки каталогов грузовых автомобилей:', error);
      const errorMessage = error instanceof CatalogsApiError 
        ? error.message 
        : 'Ошибка загрузки каталогов грузовых автомобилей';
      
      set({ 
        truckCatalogsError: errorMessage, 
        truckCatalogsLoading: false,
        truckCatalogs: []
      });
      
      toast.error(errorMessage);
    }
  },

  // Получить информацию о конкретном каталоге
  fetchCatalogInfo: async (catalogCode: string) => {
    set({ catalogInfoLoading: true, catalogInfoError: null });

    try {
      const catalogInfo = await catalogsApi.getCatalogInfo(catalogCode);
      
      set({
        catalogInfo,
        catalogInfoLoading: false,
        catalogInfoError: null
      });

      console.log(`Загружена информация о каталоге: ${catalogInfo.name}`);

    } catch (error) {
      console.error('Ошибка загрузки информации о каталоге:', error);
      const errorMessage = error instanceof CatalogsApiError 
        ? error.message 
        : 'Ошибка загрузки информации о каталоге';
      
      set({ 
        catalogInfoError: errorMessage, 
        catalogInfoLoading: false,
        catalogInfo: null
      });
      
      toast.error(errorMessage);
    }
  },

  // Очистить ошибки
  clearErrors: () => {
    set({
      catalogsError: null,
      truckCatalogsError: null,
      catalogInfoError: null
    });
  },

  // Сбросить состояние
  resetState: () => {
    set({
      catalogs: [],
      catalogsLoading: false,
      catalogsError: null,
      truckCatalogs: [],
      truckCatalogsLoading: false,
      truckCatalogsError: null,
      catalogInfo: null,
      catalogInfoLoading: false,
      catalogInfoError: null
    });
  },
}));
