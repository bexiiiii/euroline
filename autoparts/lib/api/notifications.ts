import { API_BASE } from './base'

export type NotificationType = 'ORDER' | 'RETURN' | 'SYSTEM' | 'FINANCE' | 'CART' | 'PROMO' | string
export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | string

export interface NotificationEntity {
  id: number
  userId: number
  title?: string
  body?: string
  type: NotificationType
  severity: NotificationSeverity
  createdAt: string
  readFlag: boolean
  imageUrl?: string
  target?: string
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

export async function fetchNotifications(page = 0, size = 20): Promise<PageResponse<NotificationEntity>> {
  const res = await fetch(`${API_BASE}/api/notifications?page=${page}&size=${size}` , { headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`)
  return res.json()
}

export async function markRead(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'POST', headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`Failed to mark read: ${res.status}`)
}

export async function markAllRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/notifications/read-all`, { method: 'POST', headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`Failed to mark all read: ${res.status}`)
}

export async function getUnreadCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/notifications/unread-count`, { headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`Failed to fetch unread count: ${res.status}`)
  const data = await res.json() as { count: number }
  return data.count
}
