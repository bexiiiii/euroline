// News API
import { API_BASE } from './base';
import { resolveAssetUrl } from '@/lib/utils';

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  coverImageUrl: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const mapNews = (raw: any): NewsItem => ({
  id: raw.id,
  title: raw.title,
  description: raw.description ?? '',
  coverImageUrl: resolveAssetUrl(raw.coverImageUrl) ?? '',
  content: raw.content ?? '',
  published: Boolean(raw.published),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

// Get published news (public)
export async function getPublishedNews(limit?: number): Promise<NewsItem[]> {
  const response = await fetch(buildUrl('/api/news/published', limit ? { limit } : undefined));

  if (!response.ok) {
    throw new Error('Failed to fetch published news');
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(mapNews) : [];
}

// Get news by ID (public)
export async function getNewsById(id: number): Promise<NewsItem> {
  const response = await fetch(buildUrl(`/api/news/${id}`));

  if (!response.ok) {
    throw new Error('Failed to fetch news');
  }

  const data = await response.json();
  return mapNews(data);
}
