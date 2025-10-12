import { create } from 'zustand'
import { API_BASE } from '@/lib/api/base'
import type { NotificationEntity, PageResponse } from '@/lib/api/notifications'
import { fetchNotifications, markRead, markAllRead, getUnreadCount } from '@/lib/api/notifications'

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
  unreadCount: number
  listeners: number
  load: (page?: number) => Promise<void>
  setStatusFilter: (f: StatusFilter) => void
  setTypeFilter: (f: TypeFilter) => void
  toggleRead: (id: number) => Promise<void>
  markAll: () => Promise<void>
  removeLocal: (id: number) => void
  subscribe: () => void
  unsubscribe: () => void
  loadUnreadCount: () => Promise<void>
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
  unreadCount: 0,
  listeners: 0,

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
        unreadCount: resp.content.filter(n => !n.readFlag).length,
      })
    } catch (e: any) {
      set({ error: e?.message || 'Не удалось загрузить уведомления', isLoading: false, items: [] })
    }
  },

  setStatusFilter: (f) => set({ statusFilter: f }),
  setTypeFilter: (f) => set({ typeFilter: f }),

  toggleRead: async (id: number) => {
    try {
      const items = get().items
      const it = items.find(n => n.id === id)
      if (!it) return
      if (!it.readFlag) {
        await markRead(id)
      }
      const updated = items.map(n => n.id === id ? { ...n, readFlag: !n.readFlag } : n)
      const unreadCount = updated.filter(n => !n.readFlag).length
      set({ items: updated, unreadCount })
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка изменения статуса' })
    }
  },

  markAll: async () => {
    try {
      await markAllRead()
      set({ items: get().items.map(n => ({ ...n, readFlag: true })), unreadCount: 0 })
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка пометки как прочитано' })
    }
  },

  removeLocal: (id: number) => {
    set((state) => {
      const remaining = state.items.filter(n => n.id !== id)
      const unreadCount = remaining.filter(n => !n.readFlag).length
      return { items: remaining, unreadCount }
    })
  }
  ,

  // Realtime via SSE
  subscribe: () => {
    if (typeof window === 'undefined') return
    const anyGlobal = window as any
    const currentListeners = get().listeners
    if (!anyGlobal.__notifES) {
      const token = localStorage.getItem('authToken') || ''
      const url = `${API_BASE}/api/notifications/stream?token=${encodeURIComponent(token)}`
      const es = new EventSource(url)
      es.addEventListener('notification', async () => {
        try {
          await get().load(0)
          await get().loadUnreadCount()
        } catch {}
      })
      es.onerror = () => {
        try { es.close() } catch {}
        anyGlobal.__notifES = null
        set({ listeners: 0 })
      }
      anyGlobal.__notifES = es
    }
    set({ listeners: currentListeners + 1 })
  },

  unsubscribe: () => {
    if (typeof window === 'undefined') return
    const anyGlobal = window as any
    const currentListeners = get().listeners
    const nextCount = Math.max(0, currentListeners - 1)
    if (nextCount === 0) {
      const es: EventSource | null = anyGlobal.__notifES || null
      if (es) { try { es.close() } catch {} }
      anyGlobal.__notifES = null
    }
    set({ listeners: nextCount })
  },

  loadUnreadCount: async () => {
    try {
      const count = await getUnreadCount()
      set({ unreadCount: count })
    } catch (e: any) {
      set({ error: e?.message || 'Не удалось получить количество уведомлений' })
    }
  }
}))
