"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 *  ВАЖНО ДЛЯ LAXIMO SSD:
 * 
 * SSD - это специальный параметр, который:
 * 1. Получается от Laximo при поиске автомобиля (VIN/FRAME/Wizard)
 * 2. ДОЛЖЕН передаваться во все последующие запросы для этого автомобиля
 * 3. Живёт только для текущей "сессии выбора"
 * 4. При новом поиске автомобиля - заменяется новым SSD
 */

export interface VehicleSession {
  vehicleId: string;
  ssd: string;
  catalog: string;
  brand?: string;
  name?: string;
  // Дополнительная информация об автомобиле
  attributes?: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
}

interface VehicleContextType {
  // Текущая сессия автомобиля
  session: VehicleSession | null;
  
  // Установить новую сессию автомобиля (из VIN поиска / Wizard)
  setSession: (session: VehicleSession) => void;
  
  // Обновить SSD (может измениться в процессе навигации)
  updateSsd: (newSsd: string) => void;
  
  // Очистить сессию
  clearSession: () => void;
  
  // Проверка наличия активной сессии
  hasActiveSession: () => boolean;
  
  // Получить параметры для запроса (vehicleId, ssd, catalog)
  getRequestParams: () => { vehicleId: string; ssd: string; catalog: string } | null;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export interface VehicleProviderProps {
  children: ReactNode;
}

export function VehicleProvider({ children }: VehicleProviderProps) {
  const [session, setSessionState] = useState<VehicleSession | null>(null);

  const setSession = useCallback((newSession: VehicleSession) => {
    console.log('🚗 Setting new vehicle session:', {
      vehicleId: newSession.vehicleId,
      ssd: newSession.ssd?.substring(0, 8) + '...', // Логируем только начало SSD для безопасности
      catalog: newSession.catalog,
      brand: newSession.brand,
      name: newSession.name
    });
    setSessionState(newSession);
  }, []);

  const updateSsd = useCallback((newSsd: string) => {
    if (!session) {
      console.warn('⚠️ Попытка обновить SSD без активной сессии');
      return;
    }
    
    console.log('🔄 Updating SSD in session:', {
      old: session.ssd?.substring(0, 8) + '...',
      new: newSsd?.substring(0, 8) + '...'
    });
    
    setSessionState({
      ...session,
      ssd: newSsd
    });
  }, [session]);

  const clearSession = useCallback(() => {
    console.log('🗑️ Clearing vehicle session');
    setSessionState(null);
  }, []);

  const hasActiveSession = useCallback(() => {
    return !!(session?.vehicleId && session?.ssd && session?.catalog);
  }, [session]);

  const getRequestParams = useCallback(() => {
    if (!hasActiveSession() || !session) {
      return null;
    }
    
    return {
      vehicleId: session.vehicleId,
      ssd: session.ssd,
      catalog: session.catalog
    };
  }, [session, hasActiveSession]);

  const value: VehicleContextType = {
    session,
    setSession,
    updateSsd,
    clearSession,
    hasActiveSession,
    getRequestParams
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle(): VehicleContextType {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
}

/**
 * Хук для получения параметров запроса с проверкой
 * Автоматически выбрасывает ошибку, если нет активной сессии
 */
export function useVehicleParams(): { vehicleId: string; ssd: string; catalog: string } {
  const { getRequestParams } = useVehicle();
  const params = getRequestParams();
  
  if (!params) {
    throw new Error('Нет активной сессии автомобиля. Сначала найдите автомобиль по VIN или через мастер подбора.');
  }
  
  return params;
}
