import { API_BASE } from './base'

export type Banner = {
  id: number
  title?: string
  imageUrl: string
  linkUrl?: string
  status?: string
  createdAt?: string
}

export type Page<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export async function getActiveBanners(page = 0, size = 10): Promise<Page<Banner>> {
  const url = `${API_BASE}/api/banners?status=ACTIVE&page=${page}&size=${size}`
  const headers: Record<string, string> = {};
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load banners: ${res.status}`);
  return res.json();
}

