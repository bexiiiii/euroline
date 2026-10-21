import { API_BASE } from './base';
const API_URL = `${API_BASE}/api`;

export interface VehicleDto {
  vehicleId: string;
  ssd: string;        // ⚠️ ВАЖНО: этот ssd нужно сохранить в state!
  catalog: string;
  brand: string;
  name: string;
  attributes?: VehicleAttrDto[];
}

export interface StockByOem {
  productId: number;
  stock: number;
  price: number | null;
}

export function normalizeOem(oem?: string | null): string {
  return (oem || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface VehicleAttrDto {
  name: string;
  value: string;
  unit?: string;
}

export interface CategoryDto {
  id: number;
  parentId?: number;
  code: string;
  name: string;
  imageUrl?: string;
}

export interface UnitDto {
  id?: number; // Старое поле (если есть)
  unitId?: number; // Новое поле из API
  code: string;
  name: string;
  imageUrl?: string;
  description?: string;
  filtered?: boolean; // Дополнительное поле из API
}

export interface UnitInfoDto {
  unitId: number;
  code: string;
  name: string;
  note?: string;
  imageUrl?: string;
  quickGroups?: QuickGroupDto[];
}

export interface DetailDto {
  detailId: number;
  oem: string;
  name: string;
  qty?: number;
  applicability?: string;
  brand?: string;
  catalog?: string;
  
  // Изображения и схемы
  imageUrl?: string;
  largeImageUrl?: string;
  codeOnImage?: string;
  images?: string[];
  
  // Описания и заметки
  note?: string;
  additionalNote?: string;
  footnote?: string;
  description?: string;
  componentCode?: string;
  
  // OEM и заменяемые номера
  replacedOem?: string;
  alternativeOems?: string[];
  
  // Технические характеристики
  price?: string;
  weight?: string;
  dimensions?: string;
  match?: string;
  
  // Контекстная информация от Unit
  unitName?: string;
  unitCode?: string;
  unitId?: number;
  unitSsd?: string;
  
  // Контекстная информация от Category
  categoryName?: string;
  categoryId?: number;
  categoryCode?: string;
  categorySsd?: string;
  
  // Атрибуты общего назначения
  allAttributes?: { [key: string]: string };
  rawXml?: string;
  
  // Обратная совместимость
  id?: number;
  attributes?: DetailAttrDto[];
}

export interface DetailAttrDto {
  name: string;
  value: string;
  unit?: string;
}

export interface WizardStepDto {
  ssd: string | null;        // ⚠️ ВАЖНО: может обновиться на каждом шаге!
  params: WizardParamDto[];
  finalStep: boolean;        // все параметры определены
  allowListVehicles?: boolean; // можно запросить список авто (FindVehicleByWizard2)
}

export interface WizardParamDto {
  code: string;
  label: string;
  values: WizardValueDto[];  // value.code — ssd для следующего шага
  determined?: boolean;      // параметр уже выбран
  value?: string | null;     // выбранное значение
  removeKey?: string | null; // ssd для сброса параметра
}

export interface WizardValueDto {
  code: string;
  label: string;
}

export interface QuickGroupDto {
  id: number;
  name: string;
  code?: string;
  link?: boolean;     // указывает, ведет ли группа к конкретным деталям
  synonyms?: string;  // синонимы для поиска
  children: QuickGroupDto[]; // дочерние группы
}

export interface CategoryNodeDto {
  id: number;
  parentId?: number;
  code: string;
  name: string;
  units: UnitDto[];
}

export interface ImageMapDto {
  /** ID детали (если доступно) */
  detailId?: number;
  /** Код на изображении (номер детали) */
  callout: string;
  /** Координата X */
  x: number;
  /** Координата Y */
  y: number;
  /** Ширина области */
  w: number;
  /** Высота области */
  h: number;
}

export class VehicleApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'VehicleApiError';
  }
}

/**
 * 🚨 ВАЖНО ДЛЯ РАБОТЫ С SSD:
 * 
 * После получения автомобиля (findByVin/findByFrame/wizardFinish), 
 * обязательно сохраните ssd в состоянии приложения и передавайте его 
 * во все последующие запросы для этого автомобиля.
 * 
 * При новом поиске VIN или перезапуске wizard - заменяйте старый ssd новым!
 */
class VehicleApi {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const normalizedEndpoint = `/${endpoint.replace(/^\/+/, '')}`;
      const url = `${API_URL}${normalizedEndpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Если не удалось распарсить JSON, используем статусный текст
        }

        throw new VehicleApiError(
          errorMessage,
          response.status,
          response.status.toString()
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof VehicleApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new VehicleApiError(
          'Не удалось подключиться к серверу. Проверьте интернет-соединение.',
          0,
          'NETWORK_ERROR'
        );
      }

      throw new VehicleApiError(
        error instanceof Error ? error.message : 'Неизвестная ошибка при запросе к API',
        0,
        'UNKNOWN_ERROR'
      );
    }
  }

  // ===== ПОИСК АВТОМОБИЛЕЙ (возвращают ssd) =====

  /**
   * Поиск автомобиля по VIN номеру
   * 🚨 ВАЖНО: Сохраните полученный ssd в состоянии!
   */
  async findByVin(vin: string, catalog?: string): Promise<VehicleDto> {
    const params = new URLSearchParams();
    if (catalog) params.append('catalog', catalog);
    
    const query = params.toString();
    const endpoint = `/v1/cat/vehicle/by-vin/${encodeURIComponent(vin)}${query ? '?' + query : ''}`;
    
    return this.request<VehicleDto>(endpoint);
  }

  /**
   * Поиск автомобиля по номеру кузова
   * 🚨 ВАЖНО: Сохраните полученный ssd в состоянии!
   */
  async findByFrame(frame: string, frameNo: string, catalog?: string): Promise<VehicleDto> {
    const params = new URLSearchParams({ frame, frameNo });
    if (catalog) params.append('catalog', catalog);
    
    return this.request<VehicleDto>(`/v1/cat/vehicle/by-frame?${params.toString()}`);
  }

  /**
   * Поиск автомобиля по госномеру
   * 🚨 ВАЖНО: Сохраните полученный ssd в состоянии!
   */
  async findByPlate(plate: string): Promise<VehicleDto> {
    return this.request<VehicleDto>(`/v1/cat/vehicle/by-plate/${encodeURIComponent(plate)}`);
  }

  // ===== ОСТАТКИ 1С =====

  /**
   * Остатки и цены из 1С по списку OEM. Ключ ответа — OEM в нижнем регистре без
   * пробелов/дефисов/точек (см. normalizeOem). OEM без товара в ответе отсутствуют.
   */
  async getStockByOem(oems: string[]): Promise<Record<string, StockByOem>> {
    const unique = Array.from(new Set(oems.map(normalizeOem).filter(Boolean)));
    if (unique.length === 0) return {};
    const params = new URLSearchParams();
    unique.forEach((o) => params.append('oems', o));
    return this.request<Record<string, StockByOem>>(`/products/stock-by-oem?${params.toString()}`);
  }

  // ===== WIZARD (мастер подбора автомобиля) =====

  /**
   * Начать мастер подбора автомобиля
   * Возвращает первый шаг с параметрами для выбора
   */
  async wizardStart(catalog: string): Promise<WizardStepDto> {
    return this.request<WizardStepDto>(`/v1/cat/${encodeURIComponent(catalog)}/wizard/start`);
  }

  /**
   * Шаг мастера по ssd (GetWizard2). Без ssd — стартовый шаг.
   * ssd = code выбранного значения или removeKey параметра.
   */
  async wizardStep(catalog: string, ssd?: string | null): Promise<WizardStepDto> {
    const query = ssd ? `?${new URLSearchParams({ ssd }).toString()}` : '';
    return this.request<WizardStepDto>(`/v1/cat/${encodeURIComponent(catalog)}/wizard/step${query}`);
  }

  /**
   * Автомобили, подходящие под выбранные параметры (FindVehicleByWizard2)
   */
  async wizardVehicles(catalog: string, ssd: string): Promise<VehicleDto[]> {
    const params = new URLSearchParams({ ssd });
    return this.request<VehicleDto[]>(`/v1/cat/${encodeURIComponent(catalog)}/wizard/vehicles?${params.toString()}`);
  }

  /**
   * Следующий шаг мастера
   * 🚨 ТРЕБУЕТ ssd из предыдущего шага!
   */
  async wizardNext(
    catalog: string, 
    ssd: string, 
    selections: Record<string, string>
  ): Promise<WizardStepDto> {
    const params = new URLSearchParams({ ssd });
    
    return this.request<WizardStepDto>(`/v1/cat/${encodeURIComponent(catalog)}/wizard/next?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify(selections),
    });
  }

  /**
   * Завершить мастер и получить автомобиль
   * 🚨 ТРЕБУЕТ ssd! Возвращает автомобиль с новым/обновленным ssd!
   */
  async wizardFinish(
    catalog: string, 
    ssd: string, 
    selections: Record<string, string>
  ): Promise<VehicleDto> {
    const params = new URLSearchParams({ ssd });
    
    return this.request<VehicleDto>(`/v1/cat/${encodeURIComponent(catalog)}/wizard/finish?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify(selections),
    });
  }

  // ===== НАВИГАЦИЯ ПО КАТАЛОГУ (все требуют ssd!) =====

  /**
   * Получить категории запчастей для автомобиля
   * 🚨 ТРЕБУЕТ ssd из поиска автомобиля!
   */
  async getCategories(catalog: string, vehicleId: string, ssd: string): Promise<CategoryDto[]> {
    const params = new URLSearchParams({ vehicleId, ssd });
    return this.request<CategoryDto[]>(`/v1/cat/${encodeURIComponent(catalog)}/categories?${params.toString()}`);
  }

  /**
   * Получить узлы в категории
   * 🚨 ТРЕБУЕТ ssd!
   */
  async getUnits(
    catalog: string, 
    vehicleId: string, 
    ssd: string, 
    categoryId: number
  ): Promise<UnitDto[]> {
    const params = new URLSearchParams({ 
      vehicleId, 
      ssd, 
      categoryId: categoryId.toString() 
    });
    return this.request<UnitDto[]>(`/v1/cat/${encodeURIComponent(catalog)}/units?${params.toString()}`);
  }

  /**
   * Получить информацию о узле
   * 🚨 ТРЕБУЕТ ssd!
   */
  async getUnitInfo(catalog: string, unitId: number, ssd: string): Promise<UnitInfoDto> {
    const params = new URLSearchParams({ ssd });
    return this.request<UnitInfoDto>(`/v1/cat/${encodeURIComponent(catalog)}/units/${unitId}?${params.toString()}`);
  }

  /**
   * Получить запчасти в узле
   * 🚨 ТРЕБУЕТ ssd!
   */
  async getUnitDetails(catalog: string, unitId: number, ssd: string): Promise<DetailDto[]> {
    const params = new URLSearchParams({ ssd });
    return this.request<DetailDto[]>(`/v1/cat/${encodeURIComponent(catalog)}/units/${unitId}/details?${params.toString()}`);
  }

  /**
   * Получить карту изображения для узла
   * 🚨 ТРЕБУЕТ ssd!
   */
  async getUnitImageMap(catalog: string, unitId: number, ssd: string): Promise<ImageMapDto[]> {
    const params = new URLSearchParams({ ssd });
    return this.request<ImageMapDto[]>(`/v1/cat/${encodeURIComponent(catalog)}/units/${unitId}/imagemap?${params.toString()}`);
  }

  /**
   * Получить дерево категорий с узлами
   * 🚨 ТРЕБУЕТ ssd!
   */
  async getCategoryTree(catalog: string, vehicleId: string, ssd: string): Promise<CategoryNodeDto[]> {
    const params = new URLSearchParams({ vehicleId, ssd });
    return this.request<CategoryNodeDto[]>(`/v1/cat/${encodeURIComponent(catalog)}/tree?${params.toString()}`);
  }

  /**
   * Быстрые группы запчастей
   * 🚨 ТРЕБУЕТ ssd!
   */
  async getQuickGroups(catalog: string, vehicleId: string, ssd: string): Promise<QuickGroupDto[]> {
    const params = new URLSearchParams({ vehicleId, ssd });
    return this.request<QuickGroupDto[]>(`/v1/cat/${encodeURIComponent(catalog)}/quick/groups?${params.toString()}`);
  }

  /**
   * Запчасти в быстрой группе
   * 🚨 ТРЕБУЕТ ssd!
   */
  async getQuickDetails(
    catalog: string, 
    vehicleId: string, 
    ssd: string, 
    groupId: number
  ): Promise<DetailDto[]> {
    const params = new URLSearchParams({ 
      vehicleId, 
      ssd, 
      groupId: groupId.toString() 
    });
    return this.request<DetailDto[]>(`/v1/cat/${encodeURIComponent(catalog)}/quick/details?${params.toString()}`);
  }

  /**
   * Информация об автомобиле
   * 🚨 ТРЕБУЕТ ssd!
   */
  async getVehicleInfo(catalog: string, vehicleId: string, ssd: string): Promise<VehicleDto> {
    const params = new URLSearchParams({ vehicleId, ssd });
    return this.request<VehicleDto>(`/v1/cat/${encodeURIComponent(catalog)}/vehicle/info?${params.toString()}`);
  }

  // ===== ПОИСК ЗАПЧАСТЕЙ БЕЗ ssd =====

  /**
   * Поиск запчастей по тексту (без привязки к конкретному автомобилю)
   * Этот метод НЕ требует ssd
   */
  async searchDetails(query: string, catalog?: string): Promise<DetailDto[]> {
    const params = new URLSearchParams({ query });
    if (catalog) params.append('catalog', catalog);
    
    return this.request<DetailDto[]>(`/v1/cat/search-by-text?${params.toString()}`);
  }

}

export const vehicleApi = new VehicleApi();
