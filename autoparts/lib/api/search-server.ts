import { API_BASE } from '@/lib/api/base'
import type { SearchResponse } from '@/lib/api/search'

export async function searchProductsServer(query: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query })
  const res = await fetch(`${API_BASE}/api/search?${params.toString()}`, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Search failed: ${res.status} ${text}`)
  }
  return res.json()
}
