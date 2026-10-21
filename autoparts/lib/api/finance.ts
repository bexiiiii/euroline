import { API_BASE } from './base';

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type FinanceTxn = {
  id: number;
  clientId: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export type TopUp = {
  id: number;
  clientId: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export type BalanceResponse = {
  clientId: number;
  balance: number;
  creditLimit: number;
  creditUsed: number;
  availableCredit: number;
  qrCodeUrl?: string | null;
  updatedAt: string;
}

export async function getMyTransactions(page = 0, size = 50): Promise<PageResponse<FinanceTxn>> {
  const url = `${API_BASE}/api/finance/my/transactions?page=${page}&size=${size}`;
  const res = await fetch(url, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`Failed to load transactions: ${res.status}`);
  return res.json();
}

export async function getMyTopUps(page = 0, size = 20): Promise<PageResponse<TopUp>> {
  const url = `${API_BASE}/api/finance/my/top-ups?page=${page}&size=${size}`;
  const res = await fetch(url, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`Failed to load top-ups: ${res.status}`);
  return res.json();
}

export async function createMyTopUp(amount: number): Promise<TopUp> {
  const url = `${API_BASE}/api/finance/my/top-ups`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ clientId: 0, amount }), // clientId ignored server-side
  });
  if (!res.ok) throw new Error(`Failed to create top-up: ${res.status}`);
  return res.json();
}

export async function uploadMyTopUpReceipt(id: number, file: File): Promise<TopUp> {
  const url = `${API_BASE}/api/finance/my/top-ups/${id}/receipt`;
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(url, { method: 'POST', headers: { ...authHeader() }, body: fd });
  if (!res.ok) throw new Error(`Failed to upload receipt: ${res.status}`);
  return res.json();
}

export async function getMyBalance(): Promise<BalanceResponse> {
  const url = `${API_BASE}/api/finance/my/balance`;
  const res = await fetch(url, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`Failed to load balance: ${res.status}`);
  return res.json();
}

// ── Kaspi Pay top-up (invoice to phone / QR). Balance is credited server-side after Kaspi confirms payment. ──

export type KaspiAvailability = {
  available: boolean;
  minAmount: number;
  maxAmount: number;
}

export type KaspiTopUp = {
  id: number;
  type: 'INVOICE' | 'QR';
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  kaspiStatus?: string | null;
  phone?: string | null;
  qrToken?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

async function kaspiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/finance/my/kaspi${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `Ошибка ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json();
}

export function getKaspiAvailability(): Promise<KaspiAvailability> {
  return kaspiRequest('/availability');
}

export function createKaspiInvoice(amount: number, phone: string): Promise<KaspiTopUp> {
  return kaspiRequest('/invoice', { method: 'POST', body: JSON.stringify({ amount, phone }) });
}

export function createKaspiQr(amount: number): Promise<KaspiTopUp> {
  return kaspiRequest('/qr', { method: 'POST', body: JSON.stringify({ amount }) });
}

export function getKaspiTopUp(id: number): Promise<KaspiTopUp> {
  return kaspiRequest(`/top-ups/${id}`);
}

export function cancelKaspiTopUp(id: number): Promise<KaspiTopUp> {
  return kaspiRequest(`/top-ups/${id}/cancel`, { method: 'POST' });
}
