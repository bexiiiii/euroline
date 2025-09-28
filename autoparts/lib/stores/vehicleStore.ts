import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vehicleApi, VehicleDto, CategoryDto, UnitDto, DetailDto, WizardStepDto, VehicleApiError } from '@/lib/api/vehicle';
import { toast } from 'sonner';

interface VehicleSession {
  vehicleId: string;
  ssd: string;           // 🚨 КРИТИЧЕСКИ ВАЖНО: ssd для текущей сессии
  catalog: string;
  brand: string;
  name: string;
  attributes?: any[];
}

interface WizardSession {
  catalog: string;
  currentStep: WizardStepDto | null;
  selections: Record<string, string>;
  isActive: boolean;
}

interface VehicleState {
  // Текущая сессия автомобиля
  currentVehicle: VehicleSession | null;
  
  // Состояние мастера
  wizard: WizardSession | null;
  
  // Кеш данных каталога
  categories: CategoryDto[];
  units: UnitDto[];
  details: DetailDto[];
  
  // Состояния загрузки
  isLoadingVehicle: boolean;
  isLoadingWizard: boolean;
  isLoadingCategories: boolean;
  isLoadingUnits: boolean;
  isLoadingDetails: boolean;
  
  // Ошибки
  vehicleError: string | null;
  wizardError: string | null;
  catalogError: string | null;
  
  // Действия для поиска автомобиля
  findByVin: (vin: string, catalog?: string) => Promise<VehicleDto | null>;
  findByFrame: (frame: string, frameNo: string, catalog?: string) => Promise<VehicleDto | null>;
  findByPlate: (plate: string) => Promise<VehicleDto | null>;
  
  // Действия для мастера
  startWizard: (catalog: string) => Promise<WizardStepDto | null>;
  nextWizardStep: (selections: Record<string, string>) => Promise<WizardStepDto | null>;
  finishWizard: (selections: Record<string, string>) => Promise<VehicleDto | null>;
  cancelWizard: () => void;
  
  // Действия для каталога
  loadCategories: () => Promise<CategoryDto[]>;
  loadUnits: (categoryId: number) => Promise<UnitDto[]>;
  loadUnitDetails: (unitId: number) => Promise<DetailDto[]>;
  
  // Утилиты
  clearCurrentVehicle: () => void;
  clearErrors: () => void;
  updateSsd: (newSsd: string) => void; // ⚠️ Для обновления ssd при необходимости
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      currentVehicle: null,
      wizard: null,
      categories: [],
      units: [],
      details: [],
      
      isLoadingVehicle: false,
      isLoadingWizard: false,
      isLoadingCategories: false,
      isLoadingUnits: false,
      isLoadingDetails: false,
      
      vehicleError: null,
      wizardError: null,
      catalogError: null,

      // Поиск автомобиля по VIN
      findByVin: async (vin: string, catalog?: string) => {
        set({ isLoadingVehicle: true, vehicleError: null });

        try {
          const vehicle = await vehicleApi.findByVin(vin, catalog);
          
          // 🚨 СОХРАНЯЕМ НОВУЮ СЕССИЮ С ssd!
          const newSession: VehicleSession = {
            vehicleId: vehicle.vehicleId,
            ssd: vehicle.ssd,         // ⚠️ Критически важно!
            catalog: vehicle.catalog,
            brand: vehicle.brand,
            name: vehicle.name,
            attributes: vehicle.attributes
          };

          set({
            currentVehicle: newSession,
            isLoadingVehicle: false,
            vehicleError: null,
            // Очищаем данные каталога при смене автомобиля
            categories: [],
            units: [],
            details: []
          });

          toast.success(`Автомобиль найден: ${vehicle.brand} ${vehicle.name}`);
          console.log(`🚗 Vehicle session started. SSD: ${vehicle.ssd}`);
          
          return vehicle;

        } catch (error) {
          console.error('Ошибка поиска по VIN:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка поиска автомобиля по VIN';
          
          set({ 
            vehicleError: errorMessage, 
            isLoadingVehicle: false,
            currentVehicle: null
          });
          
          toast.error(errorMessage);
          return null;
        }
      },

      // Поиск автомобиля по номеру кузова
      findByFrame: async (frame: string, frameNo: string, catalog?: string) => {
        set({ isLoadingVehicle: true, vehicleError: null });

        try {
          const vehicle = await vehicleApi.findByFrame(frame, frameNo, catalog);
          
          const newSession: VehicleSession = {
            vehicleId: vehicle.vehicleId,
            ssd: vehicle.ssd,
            catalog: vehicle.catalog,
            brand: vehicle.brand,
            name: vehicle.name,
            attributes: vehicle.attributes
          };

          set({
            currentVehicle: newSession,
            isLoadingVehicle: false,
            vehicleError: null,
            categories: [],
            units: [],
            details: []
          });

          toast.success(`Автомобиль найден: ${vehicle.brand} ${vehicle.name}`);
          console.log(`🚗 Vehicle session started. SSD: ${vehicle.ssd}`);
          
          return vehicle;

        } catch (error) {
          console.error('Ошибка поиска по Frame:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка поиска автомобиля по номеру кузова';
          
          set({ 
            vehicleError: errorMessage, 
            isLoadingVehicle: false,
            currentVehicle: null
          });
          
          toast.error(errorMessage);
          return null;
        }
      },

      // Поиск по госномеру
      findByPlate: async (plate: string) => {
        set({ isLoadingVehicle: true, vehicleError: null });

        try {
          const vehicle = await vehicleApi.findByPlate(plate);
          
          const newSession: VehicleSession = {
            vehicleId: vehicle.vehicleId,
            ssd: vehicle.ssd,
            catalog: vehicle.catalog,
            brand: vehicle.brand,
            name: vehicle.name,
            attributes: vehicle.attributes
          };

          set({
            currentVehicle: newSession,
            isLoadingVehicle: false,
            vehicleError: null,
            categories: [],
            units: [],
            details: []
          });

          toast.success(`Автомобиль найден: ${vehicle.brand} ${vehicle.name}`);
          console.log(`🚗 Vehicle session started. SSD: ${vehicle.ssd}`);
          
          return vehicle;

        } catch (error) {
          console.error('Ошибка поиска по номеру:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка поиска автомобиля по госномеру';
          
          set({ 
            vehicleError: errorMessage, 
            isLoadingVehicle: false,
            currentVehicle: null
          });
          
          toast.error(errorMessage);
          return null;
        }
      },

      // Начать мастер подбора
      startWizard: async (catalog: string) => {
        set({ isLoadingWizard: true, wizardError: null });

        try {
          const step = await vehicleApi.wizardStart(catalog);
          
          set({
            wizard: {
              catalog,
              currentStep: step,
              selections: {},
              isActive: true
            },
            isLoadingWizard: false,
            wizardError: null
          });

          toast.success('Мастер подбора запущен');
          console.log(`🧙‍♂️ Wizard started for catalog: ${catalog}. SSD: ${step.ssd}`);
          
          return step;

        } catch (error) {
          console.error('Ошибка запуска мастера:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка запуска мастера подбора';
          
          set({ 
            wizardError: errorMessage, 
            isLoadingWizard: false,
            wizard: null
          });
          
          toast.error(errorMessage);
          return null;
        }
      },

      // Следующий шаг мастера
      nextWizardStep: async (selections: Record<string, string>) => {
        const { wizard } = get();
        if (!wizard || !wizard.currentStep) {
          toast.error('Мастер не активен');
          return null;
        }

        set({ isLoadingWizard: true, wizardError: null });

        try {
          const step = await vehicleApi.wizardNext(
            wizard.catalog, 
            wizard.currentStep.ssd,  // ⚠️ Используем ssd из текущего шага
            selections
          );
          
          set({
            wizard: {
              ...wizard,
              currentStep: step,
              selections: { ...wizard.selections, ...selections }
            },
            isLoadingWizard: false,
            wizardError: null
          });

          console.log(`🧙‍♂️ Wizard step completed. New SSD: ${step.ssd}`);
          
          return step;

        } catch (error) {
          console.error('Ошибка шага мастера:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка выполнения шага мастера';
          
          set({ 
            wizardError: errorMessage, 
            isLoadingWizard: false
          });
          
          toast.error(errorMessage);
          return null;
        }
      },

      // Завершить мастер
      finishWizard: async (selections: Record<string, string>) => {
        const { wizard } = get();
        if (!wizard || !wizard.currentStep) {
          toast.error('Мастер не активен');
          return null;
        }

        set({ isLoadingWizard: true, wizardError: null });

        try {
          const vehicle = await vehicleApi.wizardFinish(
            wizard.catalog, 
            wizard.currentStep.ssd,  // ⚠️ Используем ssd из последнего шага
            { ...wizard.selections, ...selections }
          );
          
          // 🚨 СОЗДАЕМ НОВУЮ СЕССИЮ С ФИНАЛЬНЫМ ssd!
          const newSession: VehicleSession = {
            vehicleId: vehicle.vehicleId,
            ssd: vehicle.ssd,        // ⚠️ Финальный ssd от завершения мастера
            catalog: vehicle.catalog,
            brand: vehicle.brand,
            name: vehicle.name,
            attributes: vehicle.attributes
          };

          set({
            currentVehicle: newSession,
            wizard: null,            // Закрываем мастер
            isLoadingWizard: false,
            wizardError: null,
            categories: [],
            units: [],
            details: []
          });

          toast.success(`Автомобиль подобран: ${vehicle.brand} ${vehicle.name}`);
          console.log(`🚗 Vehicle found via wizard. Final SSD: ${vehicle.ssd}`);
          
          return vehicle;

        } catch (error) {
          console.error('Ошибка завершения мастера:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка завершения мастера';
          
          set({ 
            wizardError: errorMessage, 
            isLoadingWizard: false
          });
          
          toast.error(errorMessage);
          return null;
        }
      },

      // Отменить мастер
      cancelWizard: () => {
        set({ wizard: null, wizardError: null });
        toast.info('Мастер подбора отменен');
      },

      // Загрузить категории
      loadCategories: async () => {
        const { currentVehicle } = get();
        if (!currentVehicle) {
          toast.error('Сначала выберите автомобиль');
          return [];
        }

        set({ isLoadingCategories: true, catalogError: null });

        try {
          const categories = await vehicleApi.getCategories(
            currentVehicle.catalog,
            currentVehicle.vehicleId,
            currentVehicle.ssd        // ⚠️ Используем сохраненный ssd
          );
          
          set({
            categories,
            isLoadingCategories: false,
            catalogError: null
          });

          console.log(`📂 Categories loaded. Count: ${categories.length}`);
          
          return categories;

        } catch (error) {
          console.error('Ошибка загрузки категорий:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка загрузки категорий';
          
          set({ 
            catalogError: errorMessage, 
            isLoadingCategories: false,
            categories: []
          });
          
          toast.error(errorMessage);
          return [];
        }
      },

      // Загрузить узлы
      loadUnits: async (categoryId: number) => {
        const { currentVehicle } = get();
        if (!currentVehicle) {
          toast.error('Сначала выберите автомобиль');
          return [];
        }

        set({ isLoadingUnits: true, catalogError: null });

        try {
          const units = await vehicleApi.getUnits(
            currentVehicle.catalog,
            currentVehicle.vehicleId,
            currentVehicle.ssd,       // ⚠️ Используем сохраненный ssd
            categoryId
          );
          
          set({
            units,
            isLoadingUnits: false,
            catalogError: null
          });

          console.log(`🔧 Units loaded for category ${categoryId}. Count: ${units.length}`);
          
          return units;

        } catch (error) {
          console.error('Ошибка загрузки узлов:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка загрузки узлов';
          
          set({ 
            catalogError: errorMessage, 
            isLoadingUnits: false,
            units: []
          });
          
          toast.error(errorMessage);
          return [];
        }
      },

      // Загрузить детали узла
      loadUnitDetails: async (unitId: number) => {
        const { currentVehicle } = get();
        if (!currentVehicle) {
          toast.error('Сначала выберите автомобиль');
          return [];
        }

        set({ isLoadingDetails: true, catalogError: null });

        try {
          const details = await vehicleApi.getUnitDetails(
            currentVehicle.catalog,
            unitId,
            currentVehicle.ssd        // ⚠️ Используем сохраненный ssd
          );
          
          set({
            details,
            isLoadingDetails: false,
            catalogError: null
          });

          console.log(`🔩 Details loaded for unit ${unitId}. Count: ${details.length}`);
          
          return details;

        } catch (error) {
          console.error('Ошибка загрузки деталей:', error);
          const errorMessage = error instanceof VehicleApiError 
            ? error.message 
            : 'Ошибка загрузки деталей';
          
          set({ 
            catalogError: errorMessage, 
            isLoadingDetails: false,
            details: []
          });
          
          toast.error(errorMessage);
          return [];
        }
      },

      // Очистить текущий автомобиль
      clearCurrentVehicle: () => {
        set({
          currentVehicle: null,
          categories: [],
          units: [],
          details: [],
          vehicleError: null,
          catalogError: null
        });
        console.log('🧹 Vehicle session cleared');
      },

      // Очистить ошибки
      clearErrors: () => {
        set({
          vehicleError: null,
          wizardError: null,
          catalogError: null
        });
      },

      // Обновить ssd (на случай если сервер вернет новый)
      updateSsd: (newSsd: string) => {
        const { currentVehicle } = get();
        if (currentVehicle) {
          set({
            currentVehicle: {
              ...currentVehicle,
              ssd: newSsd
            }
          });
          console.log(`🔄 SSD updated: ${newSsd}`);
        }
      },

    }),
    {
      name: 'vehicle-session-storage',
      // Сохраняем только критически важные данные
      partialize: (state) => ({ 
        currentVehicle: state.currentVehicle,
        categories: state.categories,
        units: state.units 
      }),
    }
  )
);
