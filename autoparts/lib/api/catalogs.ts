import { ApiError } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface CatalogDto {
  code: string;
  name: string;
  brand: string;
  region: string;
  icon?: string;
  supportVinSearch?: boolean;
  supportFrameSearch?: boolean;
  supportQuickGroups?: boolean;
  supportDetailApplicability?: boolean;
  supportParameterIdentification?: boolean;
  supportParameterIdentification2?: boolean;
  vinExample?: string;
  frameExample?: string;
  features?: FeatureDto[];
  operations?: OperationDto[];
}

export interface FeatureDto {
  id: string;
  name: string;
  description?: string;
}

export interface OperationDto {
  id: string;
  name: string;
  description?: string;
}

export interface CatalogInfoDto {
  code: string;
  name: string;
  brand: string;
  description?: string;
  logoUrl?: string;
  version?: string;
  releaseDate?: string;
  features?: FeatureDto[];
  operations?: OperationDto[];
  supportedLanguages?: string[];
}

export class CatalogsApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'CatalogsApiError';
  }
}

class CatalogsApi {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const url = `${API_BASE}${endpoint}`;
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

        throw new CatalogsApiError(
          errorMessage,
          response.status,
          response.status.toString()
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof CatalogsApiError) {
        throw error;
      }

      // Ошибки сети или другие неожиданные ошибки
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new CatalogsApiError(
          'Не удалось подключиться к серверу. Проверьте интернет-соединение.',
          0,
          'NETWORK_ERROR'
        );
      }

      throw new CatalogsApiError(
        error instanceof Error ? error.message : 'Неизвестная ошибка при запросе к API',
        0,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Получить список всех доступных каталогов
   */
  async getCatalogs(): Promise<CatalogDto[]> {
    return this.request<CatalogDto[]>('/v1/cat/catalogs');
  }

  /**
   * Получить информацию о конкретном каталоге
   */
  async getCatalogInfo(catalog: string): Promise<CatalogInfoDto> {
    return this.request<CatalogInfoDto>(`/v1/cat/catalogs/${encodeURIComponent(catalog)}`);
  }

  /**
   * Получить каталоги только для грузовых автомобилей
   * Фильтрует каталоги по типичным брендам грузовых автомобилей
   */
  async getTruckCatalogs(): Promise<CatalogDto[]> {
    const allCatalogs = await this.getCatalogs();
    
    // Список типичных брендов грузовых автомобилей
    const truckBrands = [
      'KAMAZ', 'MAN', 'DAF', 'IVECO', 'SCANIA', 'VOLVO', 
      'MERCEDES BENZ', 'MERCEDES-BENZ', 'MERCEDES', 'FREIGHTLINER', 
      'PETERBILT', 'KENWORTH', 'MACK', 'ISUZU', 'HINO', 'FUSO',
      'TATRA', 'URAL', 'GAZ', 'ZIL', 'MAZ', 'BELAZ'
    ];

    return allCatalogs.filter(catalog => 
      truckBrands.some(brand => 
        catalog.brand?.toUpperCase().includes(brand) || 
        catalog.name?.toUpperCase().includes(brand) ||
        catalog.code?.toUpperCase().includes(brand)
      )
    );
  }
}

export const catalogsApi = new CatalogsApi();
