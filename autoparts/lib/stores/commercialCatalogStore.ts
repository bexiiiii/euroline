import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vehicleApi, VehicleDto, VehicleApiError } from '@/lib/api/vehicle';
import { catalogsApi, CatalogInfoDto } from '@/lib/api/catalogs';
import { toast } from 'sonner';

interface CommercialCatalogState {
  // Информация о каталоге
  catalogInfo: CatalogInfoDto | null;
  catalogInfoLoading: boolean;
  catalogInfoError: string | null;
  
  // Поиск по VIN
  vehicleByVin: VehicleDto | null;
  vinSearchLoading: boolean;
  vinSearchError: string | null;
  lastSearchedVin: string | null;
  
  // Поиск по номеру рамы
  vehicleByFrame: VehicleDto | null;
  frameSearchLoading: boolean;
  frameSearchError: string | null;
  lastSearchedFrame: string | null;
  
  // Wizard search state
  wizardStep: any | null;
  wizardLoading: boolean;
  wizardError: string | null;
  selectedWizardParams: Record<string, string>;
  
  // Текущий каталог
  currentCatalogCode: string | null;
  
  // Действия
  setCatalogCode: (catalogCode: string) => void;
  fetchCatalogInfo: (catalogCode: string) => Promise<void>;
  searchByVin: (catalogCode: string, vin: string) => Promise<void>;
  searchByFrame: (catalogCode: string, frameNumber: string) => Promise<void>;
  initializeWizard: (catalogCode: string) => Promise<void>;
  nextWizardStep: (catalogCode: string, ssd: string, params: Record<string, string>) => Promise<void>;
  completeWizardSearch: (catalogCode: string, ssd: string) => Promise<void>;
  clearSearchResults: () => void;
  clearErrors: () => void;
  resetState: () => void;
}

export const useCommercialCatalogStore = create<CommercialCatalogState>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      catalogInfo: null,
      catalogInfoLoading: false,
      catalogInfoError: null,
      
      vehicleByVin: null,
      vinSearchLoading: false,
      vinSearchError: null,
      lastSearchedVin: null,
      
      vehicleByFrame: null,
      frameSearchLoading: false,
      frameSearchError: null,
      lastSearchedFrame: null,
      
      wizardStep: null,
      wizardLoading: false,
      wizardError: null,
      selectedWizardParams: {},
      
      currentCatalogCode: null,

      // Установить текущий каталог
      setCatalogCode: (catalogCode: string) => {
        set({ currentCatalogCode: catalogCode });
      },

      // Получить информацию о каталоге
      fetchCatalogInfo: async (catalogCode: string) => {
        set({ 
          catalogInfoLoading: true, 
          catalogInfoError: null,
          currentCatalogCode: catalogCode 
        });

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
          const errorMessage = error instanceof Error 
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

      // Поиск по VIN
      searchByVin: async (catalogCode: string, vin: string) => {
        set({ 
          vinSearchLoading: true, 
          vinSearchError: null,
          vehicleByVin: null,
          lastSearchedVin: vin
        });

        try {
          const vehicle = await vehicleApi.findByVin(vin, catalogCode);
          
          set({
            vehicleByVin: vehicle,
            vinSearchLoading: false,
            vinSearchError: null
          });

          toast.success(`Автомобиль найден: ${vehicle.name}`);
          console.log('Найден автомобиль по VIN:', vehicle);

        } catch (error) {
          console.error('Ошибка поиска по VIN:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка поиска по VIN номеру';
          
          set({ 
            vinSearchError: errorMessage, 
            vinSearchLoading: false,
            vehicleByVin: null
          });
          
          toast.error(errorMessage);
        }
      },

      // Поиск по номеру рамы
      searchByFrame: async (catalogCode: string, frameNumber: string) => {
        set({ 
          frameSearchLoading: true, 
          frameSearchError: null,
          vehicleByFrame: null,
          lastSearchedFrame: frameNumber
        });

        try {
          // Пока используем placeholder, так как точный API для рамы не определен
          const vehicle = await vehicleApi.findByFrame("frame", frameNumber, catalogCode);
          
          set({
            vehicleByFrame: vehicle,
            frameSearchLoading: false,
            frameSearchError: null
          });

          toast.success(`Автомобиль найден: ${vehicle.name}`);
          console.log('Найден автомобиль по номеру рамы:', vehicle);

        } catch (error) {
          console.error('Ошибка поиска по номеру рамы:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка поиска по номеру рамы';
          
          set({ 
            frameSearchError: errorMessage, 
            frameSearchLoading: false,
            vehicleByFrame: null
          });
          
          toast.error(errorMessage);
        }
      },

      // Инициализация мастера поиска
      initializeWizard: async (catalogCode: string) => {
        set({ 
          wizardLoading: true, 
          wizardError: null,
          wizardStep: null,
          selectedWizardParams: {}
        });

        try {
          const wizardStep = await vehicleApi.wizardStart(catalogCode);
          
          set({
            wizardStep,
            wizardLoading: false,
            wizardError: null
          });

          console.log('Инициализирован мастер поиска:', wizardStep);

        } catch (error) {
          console.error('Ошибка инициализации мастера поиска:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка инициализации мастера поиска';
          
          set({ 
            wizardError: errorMessage, 
            wizardLoading: false,
            wizardStep: null
          });
          
          toast.error(errorMessage);
        }
      },

      // Следующий шаг мастера
      nextWizardStep: async (catalogCode: string, ssd: string, params: Record<string, string>) => {
        set({ 
          wizardLoading: true, 
          wizardError: null,
          selectedWizardParams: { ...get().selectedWizardParams, ...params }
        });

        try {
          const wizardStep = await vehicleApi.wizardNext(catalogCode, ssd, params);
          
          set({
            wizardStep,
            wizardLoading: false,
            wizardError: null
          });

          console.log('Следующий шаг мастера:', wizardStep);

        } catch (error) {
          console.error('Ошибка следующего шага мастера:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка получения следующего шага';
          
          set({ 
            wizardError: errorMessage, 
            wizardLoading: false
          });
          
          toast.error(errorMessage);
        }
      },

      // Завершение поиска через мастер
      completeWizardSearch: async (catalogCode: string, ssd: string) => {
        set({ wizardLoading: true, wizardError: null });

        try {
          const vehicle = await vehicleApi.wizardFinish(catalogCode, ssd, get().selectedWizardParams);
          
          set({
            vehicleByVin: vehicle, // Используем тот же слот для результата
            wizardLoading: false,
            wizardError: null,
            wizardStep: null,
            selectedWizardParams: {}
          });

          toast.success(`Автомобиль найден: ${vehicle.name}`);
          console.log('Автомобиль найден через мастер:', vehicle);

        } catch (error) {
          console.error('Ошибка завершения поиска через мастер:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка поиска автомобиля';
          
          set({ 
            wizardError: errorMessage, 
            wizardLoading: false
          });
          
          toast.error(errorMessage);
        }
      },

      // Очистить результаты поиска
      clearSearchResults: () => {
        set({
          vehicleByVin: null,
          vehicleByFrame: null,
          wizardStep: null,
          selectedWizardParams: {},
          lastSearchedVin: null,
          lastSearchedFrame: null
        });
      },

      // Очистить ошибки
      clearErrors: () => {
        set({
          catalogInfoError: null,
          vinSearchError: null,
          frameSearchError: null,
          wizardError: null
        });
      },

      // Сбросить состояние
      resetState: () => {
        set({
          catalogInfo: null,
          catalogInfoLoading: false,
          catalogInfoError: null,
          vehicleByVin: null,
          vinSearchLoading: false,
          vinSearchError: null,
          lastSearchedVin: null,
          vehicleByFrame: null,
          frameSearchLoading: false,
          frameSearchError: null,
          lastSearchedFrame: null,
          wizardStep: null,
          wizardLoading: false,
          wizardError: null,
          selectedWizardParams: {},
          currentCatalogCode: null
        });
      },
    }),
    {
      name: 'commercial-catalog-store',
      partialize: (state) => ({
        currentCatalogCode: state.currentCatalogCode,
        selectedWizardParams: state.selectedWizardParams,
        lastSearchedVin: state.lastSearchedVin,
        lastSearchedFrame: state.lastSearchedFrame,
      }),
    }
  )
);
