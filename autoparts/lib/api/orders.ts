import { API_BASE } from './base'
import type { PaginatedResponse } from './types'

export type OrderItemDTO = {
  productId: number
  productName: string
  quantity: number
  price: number | null
}

export type OrderResponse = {
  id: number
  userId: number
  status: string
  createdAt: string
  code: string
  deliveryAddress?: string
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

export async function createOrder(deliveryAddress: string, idempotencyKey: string): Promise<OrderResponse> {
  const url = `${API_BASE}/api/orders/create`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ deliveryAddress, idempotencyKey })
  })
  if (!res.ok) throw new Error(`Failed to create order: ${res.status}`)
  return res.json()
}
