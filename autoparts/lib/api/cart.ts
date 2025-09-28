import { API_BASE } from './base';

export interface CartProduct {
  id: number;
  name?: string;
  brand?: string;
  code?: string;
  imageUrl?: string;
  price?: number; // integer
}

export interface CartItemEntity {
  id: number;
  quantity: number;
  price?: string; // backend BigDecimal snapshot, often null
  product: CartProduct;
}

export interface CartEntity {
  id: number;
  user: { id: number };
  items: CartItemEntity[];
}

function authHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getCart(): Promise<CartEntity> {
  const res = await fetch(`${API_BASE}/api/cart`, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`Failed to load cart: ${res.status}`);
  return res.json();
}

export async function addToCart(productId: number, quantity = 1): Promise<CartEntity> {
  const url = new URL(`${API_BASE}/api/cart/add`);
  url.searchParams.set('productId', String(productId));
  url.searchParams.set('quantity', String(quantity));
  const res = await fetch(url.toString(), { method: 'POST', headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`Failed to add to cart: ${res.status}`);
  return res.json();
}

export async function removeFromCart(productId: number): Promise<CartEntity> {
  const url = new URL(`${API_BASE}/api/cart/remove`);
  url.searchParams.set('productId', String(productId));
  const res = await fetch(url.toString(), { method: 'DELETE', headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`Failed to remove from cart: ${res.status}`);
  return res.json();
}

export async function updateQuantity(productId: number, quantity: number): Promise<CartEntity> {
  const url = new URL(`${API_BASE}/api/cart/update`);
  url.searchParams.set('productId', String(productId));
  url.searchParams.set('quantity', String(quantity));
  const res = await fetch(url.toString(), { method: 'PATCH', headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`Failed to update quantity: ${res.status}`);
  return res.json();
}

export interface AddByOemPayload {
  oem: string;
  name?: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  quantity?: number;
}

export async function addToCartByOem(payload: AddByOemPayload): Promise<CartEntity> {
  const body = {
    oem: payload.oem,
    name: payload.name ?? payload.oem,
    brand: payload.brand ?? 'UNKNOWN',
    price: payload.price,
    imageUrl: payload.imageUrl,
    quantity: payload.quantity ?? 1,
  };
  const res = await fetch(`${API_BASE}/api/cart/add-by-oem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to add by OEM: ${res.status}`);
  return res.json();
}
