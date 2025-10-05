// News API
import { apiFetch } from '../api';

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

export interface NewsRequest {
  title: string;
  description?: string;
  coverImageUrl?: string;
  content: string;
  published: boolean;
}

const mapNews = (raw: any): NewsItem => ({
  id: raw.id,
  title: raw.title,
  description: raw.description ?? '',
  coverImageUrl: raw.coverImageUrl ?? '',
  content: raw.content ?? '',
  published: Boolean(raw.published),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

// Get all news (admin only)
export async function getNews(): Promise<NewsItem[]> {
  const raw = await apiFetch<any[]>('/api/news');
  return raw.map(mapNews);
}

// Get published news (public)
export async function getPublishedNews(limit?: number): Promise<NewsItem[]> {
  const query = limit ? `?limit=${encodeURIComponent(limit)}` : '';
  const raw = await apiFetch<any[]>(`/api/news/published${query}`);
  return raw.map(mapNews);
}

// Get news by ID (admin only)
export async function getNewsById(id: number): Promise<NewsItem> {
  const raw = await apiFetch<any>(`/api/news/${id}`);
  return mapNews(raw);
}

// Create news (admin only)
export async function createNews(news: NewsRequest): Promise<NewsItem> {
  const raw = await apiFetch<any>('/api/news', {
    method: 'POST',
    body: JSON.stringify(news),
  });
  return mapNews(raw);
}

// Update news (admin only)
export async function updateNews(id: number, news: NewsRequest): Promise<NewsItem> {
  const raw = await apiFetch<any>(`/api/news/${id}`, {
    method: 'PUT',
    body: JSON.stringify(news),
  });
  return mapNews(raw);
}

// Delete news (admin only)
export async function deleteNews(id: number): Promise<void> {
  await apiFetch<void>(`/api/news/${id}`, {
    method: 'DELETE',
  });
}
