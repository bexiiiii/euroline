import { create } from 'zustand'
import { API_BASE } from '@/lib/api/base'
import type { NotificationEntity, PageResponse } from '@/lib/api/notifications'
import { fetchNotifications, markRead, markAllRead } from '@/lib/api/notifications'

export type StatusFilter = 'all' | 'read' | 'unread'
export type TypeFilter = 'all' | 'info' | 'warning' | 'error' | 'success'

type State = {
  items: NotificationEntity[]
  page: number
  size: number
  totalPages: number
  totalElements: number
  isLoading: boolean
  error: string | null
  statusFilter: StatusFilter
  typeFilter: TypeFilter
  load: (page?: number) => Promise<void>
  setStatusFilter: (f: StatusFilter) => void
  setTypeFilter: (f: TypeFilter) => void
  toggleRead: (id: number) => Promise<void>
  markAll: () => Promise<void>
  removeLocal: (id: number) => void
  subscribe: () => void
  unsubscribe: () => void
}

export const useNotificationsStore = create<State>((set, get) => ({
  items: [],
  page: 0,
  size: 20,
  totalPages: 0,
  totalElements: 0,
  isLoading: false,
  error: null,
  statusFilter: 'all',
  typeFilter: 'all',

  load: async (page?: number) => {
    try {
      const p = page ?? get().page
      set({ isLoading: true, error: null })
      const resp: PageResponse<NotificationEntity> = await fetchNotifications(p, get().size)
      set({
        items: resp.content,
        page: resp.number,
        size: resp.size,
        totalPages: resp.totalPages,
        totalElements: resp.totalElements,
        isLoading: false,
      })
    } catch (e: any) {
      set({ error: e?.message || 'Не удалось загрузить уведомления', isLoading: false, items: [] })
    }
  },

  setStatusFilter: (f) => set({ statusFilter: f }),
  setTypeFilter: (f) => set({ typeFilter: f }),

  toggleRead: async (id: number) => {
    try {
      const it = get().items.find(n => n.id === id)
      if (!it) return
      if (!it.readFlag) {
        await markRead(id)
      }
      // локально инвертируем, чтобы ощущалось быстрее
      set({ items: get().items.map(n => n.id === id ? { ...n, readFlag: !n.readFlag } : n) })
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка изменения статуса' })
    }
  },

  markAll: async () => {
    try {
      await markAllRead()
      set({ items: get().items.map(n => ({ ...n, readFlag: true })) })
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка пометки как прочитано' })
    }
  },

  removeLocal: (id: number) => set({ items: get().items.filter(n => n.id !== id) })
  ,

  // Realtime via SSE
  subscribe: () => {
    if (typeof window === 'undefined') return
    const anyGlobal = window as any
    if (anyGlobal.__notifES) return // already subscribed
    const token = localStorage.getItem('authToken') || ''
    const url = `${API_BASE}/api/notifications/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    es.addEventListener('notification', async () => {
      try { await get().load(0) } catch {}
    })
    es.onerror = () => {
      try { es.close() } catch {}
      anyGlobal.__notifES = null
    }
    anyGlobal.__notifES = es
  },

  unsubscribe: () => {
    if (typeof window === 'undefined') return
    const anyGlobal = window as any
    const es: EventSource | null = anyGlobal.__notifES || null
    if (es) { try { es.close() } catch {} }
    anyGlobal.__notifES = null
  }
}))
