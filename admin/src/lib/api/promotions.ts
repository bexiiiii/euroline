import { apiFetch } from '../api';
import { PageResponse } from './types';

// ===== Promotions =====
export interface Promotion {
  id: number;
  title: string;
  description: string;
  discount: number; // UI field; backend doesn't provide — default to 0
  type: 'PERCENTAGE' | 'FIXED'; // UI field; backend doesn't provide — default to 'PERCENTAGE'
  startDate: string; // maps from backend startsAt
  endDate: string; // maps from backend endsAt
  minOrderAmount?: number; // UI-only
  maxDiscountAmount?: number; // UI-only
  usageLimit?: number; // UI-only
  applicableCategories?: string[]; // UI-only
  applicableProducts?: number[]; // UI-only
  isActive: boolean; // maps from backend status === 'ACTIVE'
  usageCount: number; // UI-only, default 0
  createdAt?: string;
}

export interface CreatePromotionRequest {
  title: string;
  description: string;
  discount: number;
  type: 'PERCENTAGE' | 'FIXED';
  startDate: string; // yyyy-mm-dd or ISO
  endDate: string; // yyyy-mm-dd or ISO
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  applicableCategories?: string[];
  applicableProducts?: number[];
}

export interface UpdatePromotionRequest extends CreatePromotionRequest {
  isActive?: boolean;
}

function mapPromotionFromBackend(p: any): Promotion {
  return {
    id: p.id,
    title: p.title ?? '',
    description: p.description ?? '',
    discount: p.discount ?? 0,
    type: (p.type as 'PERCENTAGE' | 'FIXED') ?? 'PERCENTAGE',
    startDate: p.startDate ?? p.startsAt ?? '',
    endDate: p.endDate ?? p.endsAt ?? '',
    minOrderAmount: p.minOrderAmount,
    maxDiscountAmount: p.maxDiscountAmount,
    usageLimit: p.usageLimit,
    applicableCategories: p.applicableCategories ?? [],
    applicableProducts: p.applicableProducts ?? [],
    isActive: p.isActive ?? p.status === 'ACTIVE',
    usageCount: p.usageCount ?? 0,
    createdAt: p.createdAt,
  };
}

function toBackendPromotionPayload(req: CreatePromotionRequest | UpdatePromotionRequest) {
  const startsAtISO = req.startDate ? new Date(req.startDate).toISOString() : undefined;
  const endsAtISO = req.endDate ? new Date(req.endDate).toISOString() : undefined;
  return {
    title: req.title,
    description: req.description,
    // backend accepts startsAt/endsAt and status
    ...(startsAtISO ? { startsAt: startsAtISO } : {}),
    ...(endsAtISO ? { endsAt: endsAtISO } : {}),
    // status is optional on update; for create default ACTIVE
  } as any;
}

export const promotionsApi = {
  getPromotions: async (page = 0, size = 10, status?: string): Promise<PageResponse<Promotion>> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('size', String(size));
    if (status) params.append('status', status);

    const raw = await apiFetch<PageResponse<any>>(`/api/promotions?${params.toString()}`);
    return {
      ...raw,
      content: (raw.content || []).map(mapPromotionFromBackend),
    };
  },

  getPromotion: async (id: number): Promise<Promotion> => {
    const raw = await apiFetch<any>(`/api/promotions/${id}`);
    return mapPromotionFromBackend(raw);
  },

  createPromotion: async (request: CreatePromotionRequest): Promise<Promotion> => {
    const payload = { ...toBackendPromotionPayload(request), status: 'ACTIVE' };
    const raw = await apiFetch<any>(`/api/promotions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapPromotionFromBackend(raw);
  },

  updatePromotion: async (id: number, request: UpdatePromotionRequest): Promise<Promotion> => {
    const rawCurrent = await apiFetch<any>(`/api/promotions/${id}`);
    const nextStatus = request.isActive === undefined ? rawCurrent.status : (request.isActive ? 'ACTIVE' : 'INACTIVE');
    const payload = { ...toBackendPromotionPayload(request), status: nextStatus };
    const raw = await apiFetch<any>(`/api/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapPromotionFromBackend(raw);
  },

  deletePromotion: async (id: number): Promise<void> => {
    await apiFetch<void>(`/api/promotions/${id}`, { method: 'DELETE' });
  },

  togglePromotionStatus: async (id: number): Promise<Promotion> => {
    const current = await apiFetch<any>(`/api/promotions/${id}`);
    const newStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const raw = await apiFetch<any>(`/api/promotions/${id}/status?status=${encodeURIComponent(newStatus)}`, {
      method: 'PATCH',
    });
    return mapPromotionFromBackend(raw);
  },
};

// ===== Banners =====
export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  link?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface CreateBannerRequest {
  title: string;
  imageUrl?: string;
  link?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export type UpdateBannerRequest = CreateBannerRequest;

function mapBannerFromBackend(b: any): Banner {
  return {
    id: b.id,
    title: b.title ?? '',
    imageUrl: b.imageUrl ?? '',
    link: b.link ?? b.linkUrl,
    status: (b.status as 'ACTIVE' | 'INACTIVE') ?? 'INACTIVE',
    createdAt: b.createdAt,
  };
}

export const bannersApi = {
  getBanners: async (page = 0, size = 10, sort = 'createdAt,desc'): Promise<PageResponse<Banner>> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('size', String(size));
    // Backend sorts by createdAt desc by default; custom sort may be ignored
    const raw = await apiFetch<PageResponse<any>>(`/api/banners?${params.toString()}`);
    return {
      ...raw,
      content: (raw.content || []).map(mapBannerFromBackend),
    };
  },

  getBanner: async (id: number): Promise<Banner> => {
    const raw = await apiFetch<any>(`/api/banners/${id}`);
    return mapBannerFromBackend(raw);
  },

  createBanner: async (request: CreateBannerRequest): Promise<Banner> => {
    const payload: Record<string, any> = {
      title: request.title,
      status: request.status ?? 'ACTIVE',
    };
    if (request.link !== undefined) {
      payload.linkUrl = request.link;
    }
    if (request.imageUrl !== undefined) {
      payload.imageUrl = request.imageUrl;
    }
    const raw = await apiFetch<any>(`/api/banners`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapBannerFromBackend(raw);
  },

  updateBanner: async (id: number, request: UpdateBannerRequest): Promise<Banner> => {
    const payload: Record<string, any> = {
      title: request.title,
      status: request.status ?? 'ACTIVE',
    };
    if (request.link !== undefined) {
      payload.linkUrl = request.link;
    }
    if (request.imageUrl !== undefined) {
      payload.imageUrl = request.imageUrl;
    }
    const raw = await apiFetch<any>(`/api/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapBannerFromBackend(raw);
  },

  deleteBanner: async (id: number): Promise<void> => {
    await apiFetch<void>(`/api/banners/${id}`, { method: 'DELETE' });
  },

  toggleBannerStatus: async (id: number): Promise<Banner> => {
    const current = await apiFetch<any>(`/api/banners/${id}`);
    const newStatus = current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const raw = await apiFetch<any>(`/api/banners/${id}/status?status=${encodeURIComponent(newStatus)}`, {
      method: 'PATCH',
    });
    return mapBannerFromBackend(raw);
  },

  uploadBannerImage: async (id: number, file: File): Promise<Banner> => {
    const formData = new FormData();
    formData.append('file', file);
    const raw = await apiFetch<any>(`/api/banners/${id}/upload`, {
      method: 'POST',
      body: formData,
    });
    return mapBannerFromBackend(raw);
  },
};
