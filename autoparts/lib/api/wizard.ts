import { VehicleDto, WizardStepDto } from './vehicle';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface WizardStartBody {
  catalog: string;
  locale?: string;
  vin?: string;
}

export interface WizardNextBody {
  catalog: string;
  ssd: string;
  selection: { key: string; value: string };
}

export interface WizardFinishBody {
  catalog: string;
  ssd: string;
  locale?: string;
}

class WizardApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'WizardApiError';
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const err = await res.json();
        msg = err?.message || err?.error || msg;
      } catch {}
      throw new WizardApiError(msg, res.status, String(res.status));
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof WizardApiError) throw e;
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new WizardApiError('Сервер недоступен', 0, 'NETWORK_ERROR');
    }
    throw new WizardApiError(e instanceof Error ? e.message : 'Неизвестная ошибка', 0, 'UNKNOWN_ERROR');
  }
}

export const wizardApi = {
  start(body: WizardStartBody): Promise<WizardStepDto> {
    return request<WizardStepDto>(`/api/v1/wizard/start`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  next(body: WizardNextBody): Promise<WizardStepDto> {
    return request<WizardStepDto>(`/api/v1/wizard/next`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  finish(body: WizardFinishBody): Promise<VehicleDto> {
    return request<VehicleDto>(`/api/v1/wizard/finish`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

export type { WizardStepDto };
