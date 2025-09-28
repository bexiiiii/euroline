import { API_BASE } from './base'

export interface SearchHistoryItem {
  id: number
  customerId: number
  query: string
  createdAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getMySearchHistory(page = 0, size = 20): Promise<PageResponse<SearchHistoryItem>> {
  const url = `${API_BASE}/api/customers/my/search-history?page=${page}&size=${size}`
  const res = await fetch(url, { headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`Failed to load search history: ${res.status}`)
  return res.json()
}

