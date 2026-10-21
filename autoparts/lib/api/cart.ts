import { API_BASE } from './base';

export interface CartProduct {
  id: number;
  name?: string;
  brand?: string;
  code?: string;
  sku?: string;
  imageUrl?: string;
  price?: number; // integer
}

export interface CartItemEntity {
  id: number;
  quantity: number;
  price?: string; // backend BigDecimal snapshot, often null
  warehouseName?: string;
  warehouseRefKey?: string;
  product: CartProduct;
}

export interface CartEntity {
  id: number;
  user: { id: number };
  items: CartItemEntity[];
}

export class CartApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'CartApiError';
  }
}

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getCart(): Promise<CartEntity> {
  const res = await fetch(`${API_BASE}/api/cart`, { headers: { ...authHeader() } });
  if (!res.ok) throw new CartApiError(res.status, `Failed to load cart: ${res.status}`);
  return res.json();
}

export async function addToCart(productId: number, quantity = 1): Promise<CartEntity> {
  const url = new URL(`${API_BASE}/api/cart/add`);
  url.searchParams.set('productId', String(productId));
  url.searchParams.set('quantity', String(quantity));
  const res = await fetch(url.toString(), { method: 'POST', headers: { ...authHeader() } });
  if (!res.ok) throw new CartApiError(res.status, `Failed to add to cart: ${res.status}`);
  return res.json();
}

export async function removeFromCart(productId: number): Promise<CartEntity> {
  const url = new URL(`${API_BASE}/api/cart/remove`);
  url.searchParams.set('productId', String(productId));
  const res = await fetch(url.toString(), { method: 'DELETE', headers: { ...authHeader() } });
  if (!res.ok) throw new CartApiError(res.status, `Failed to remove from cart: ${res.status}`);
  return res.json();
}

export async function updateQuantity(productId: number, quantity: number): Promise<CartEntity> {
  const url = new URL(`${API_BASE}/api/cart/update`);
  url.searchParams.set('productId', String(productId));
  url.searchParams.set('quantity', String(quantity));
  const res = await fetch(url.toString(), { method: 'PATCH', headers: { ...authHeader() } });
  if (!res.ok) throw new CartApiError(res.status, `Failed to update quantity: ${res.status}`);
  return res.json();
}

async function offerRequest(path: string, method: string, body?: unknown): Promise<CartEntity> {
  const res = await fetch(`${API_BASE}/api/cart${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    const message = res.status === 401 || res.status === 403
      ? 'Войдите в аккаунт, чтобы добавить товар в корзину.'
      : error?.message || 'Не удалось обновить корзину';
    throw new CartApiError(res.status, message);
  }
  return res.json();
}

export const addOfferToCart = (productId: number, warehouseRefKey: string, quantity: number) =>
  offerRequest('/offers', 'POST', { productId, warehouseRefKey, quantity });
export const updateCartItem = (itemId: number, quantity: number) =>
  offerRequest(`/items/${itemId}?quantity=${quantity}`, 'PATCH');
export const removeCartItem = (itemId: number) => offerRequest(`/items/${itemId}`, 'DELETE');

export interface AddByOemPayload {
  oem: string;
  name?: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  warehouseName?: string;
  warehouseRefKey?: string;
  quantity?: number;
}

export async function addToCartByOem(payload: AddByOemPayload): Promise<CartEntity> {
  const body = {
    oem: payload.oem,
    name: payload.name ?? payload.oem,
    brand: payload.brand ?? 'UNKNOWN',
    price: payload.price,
    imageUrl: payload.imageUrl,
    warehouseName: payload.warehouseName,
    warehouseRefKey: payload.warehouseRefKey,
    quantity: payload.quantity ?? 1,
  };
  const res = await fetch(`${API_BASE}/api/cart/add-by-oem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new CartApiError(res.status, `Failed to add by OEM: ${res.status}`);
  return res.json();
}
