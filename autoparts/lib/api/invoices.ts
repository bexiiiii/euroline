import { API_BASE } from './base'

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type InvoiceItem = {
  itemId: number
  productId: number
  article: string
  brand: string
  name: string
  price: number
  quantity: number
  total: number
  returned: number
  returnDeadline: string
}

export type InvoiceDetails = {
  id: number
  invoiceNumber: string
  invoiceDate: string
  createdAt: string
  receiver: { id: string; name: string; phone?: string }
  address?: string
  deliveryMethod: string
  receiptNumber: string
  paymentMethod: string
  items: InvoiceItem[]
}

export type ReturnItemReq = { productId: number; quantity: number }
export type CreateReturnReq = { reason: string; description?: string; method?: string; items: ReturnItemReq[] }
export type CreateReturnRes = { id: number; amount: number; status: string; createdAt: string }

export async function getInvoiceDetails(id: number): Promise<InvoiceDetails> {
  const res = await fetch(`${API_BASE}/api/my/invoices/${id}`, { headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`Failed to load invoice: ${res.status}`)
  return res.json()
}

export async function submitInvoiceReturn(id: number, payload: CreateReturnReq): Promise<CreateReturnRes> {
  const res = await fetch(`${API_BASE}/api/my/invoices/${id}/returns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Failed to submit return: ${res.status}`)
  return res.json()
}

export type MyReturn = { id: number; orderId: number; customerId: number; reason: string; status: string; createdAt: string; amount?: number }
export type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number; size: number }

export async function getMyReturns(page=0, size=20): Promise<Page<MyReturn>>{
  const res = await fetch(`${API_BASE}/api/returns/my?page=${page}&size=${size}`, { headers: { ...authHeader() } })
  if (!res.ok) throw new Error(`Failed to load returns: ${res.status}`)
  return res.json()
}

