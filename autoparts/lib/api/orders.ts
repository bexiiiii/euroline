import { API_BASE } from './base'
import type { PaginatedResponse } from './types'

export type OrderItemDTO = {
  id?: number
  productId: number
  productName: string
  productCode?: string | null
  sku?: string | null
  brand?: string | null
  warehouseName?: string | null
  warehouseRefKey?: string | null
  quantity: number
  price: number | null
  total?: number | null
}

export type OrderResponse = {
  id: number
  userId: number
  status: string
  paymentStatus?: string
  createdAt: string
  code: string
  deliveryAddress?: string
  warehouseRefKey?: string | null
  totalAmount?: number | null
  comment?: string | null
  oneCComment?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  customerCity?: string | null
  customerAddress?: string | null
  items: OrderItemDTO[]
}

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getMyOrders(page = 0, size = 20): Promise<PaginatedResponse<OrderResponse>> {
  const url = `${API_BASE}/api/orders/my?page=${page}&size=${size}`
  const res = await fetch(url, { headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`Failed to load orders: ${res.status}`)
  return res.json()
}

export async function createOrder(deliveryAddress: string, idempotencyKey: string, comment?: string): Promise<OrderResponse> {
  const url = `${API_BASE}/api/orders/create`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ deliveryAddress, idempotencyKey, comment: comment?.trim() || undefined })
  })
  if (!res.ok) {
    const error = await res.json().catch(() => null)
    throw new Error(error?.message || `Не удалось создать заказ: ${res.status}`)
  }
  return res.json()
}

/** Один заказ текущего пользователя (для накладной). */
export async function getMyOrder(id: number | string): Promise<OrderResponse> {
  const res = await fetch(`${API_BASE}/api/orders/my/${encodeURIComponent(String(id))}`, { headers: { ...authHeader() } })
  if (!res.ok) throw new Error(res.status === 404 ? 'Заказ не найден' : `Не удалось загрузить заказ: ${res.status}`)
  return res.json()
}

export type WarehouseDTO = {
  refKey: string
  name: string | null
  code: string | null
}

/** Склады из справочника 1С (onec_warehouses + склады из остатков и заказов). */
export async function getWarehouses(): Promise<WarehouseDTO[]> {
  const res = await fetch(`${API_BASE}/api/warehouses`, { headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`Failed to load warehouses: ${res.status}`)
  return res.json()
}
