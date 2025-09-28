import { create } from 'zustand'
import { getMySearchHistory, SearchHistoryItem, PageResponse } from '@/lib/api/searchHistory'

type State = {
  items: SearchHistoryItem[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  isLoading: boolean
  error: string | null
  load: (page?: number) => Promise<void>
}

export const useSearchHistoryStore = create<State>((set, get) => ({
  items: [],
  page: 0,
  size: 20,
  totalPages: 0,
  totalElements: 0,
  isLoading: false,
  error: null,

  load: async (page?: number) => {
    try {
      const p = page ?? get().page
      set({ isLoading: true, error: null })
      const res: PageResponse<SearchHistoryItem> = await getMySearchHistory(p, get().size)
      set({
        items: res.content,
        page: res.number,
        size: res.size,
        totalPages: res.totalPages,
        totalElements: res.totalElements,
        isLoading: false,
      })
    } catch (e: any) {
      set({ error: e?.message || 'Не удалось загрузить историю поиска', isLoading: false, items: [] })
    }
  }
}))

