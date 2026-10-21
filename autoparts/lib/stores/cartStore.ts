import { create } from 'zustand'
import { resolveProductImageUrl } from '@/lib/utils'
import { addToCart, addToCartByOem, addOfferToCart, CartApiError, getCart, removeCartItem, updateCartItem } from '@/lib/api/cart'

const hasAuthToken = () =>
  typeof window !== 'undefined' && Boolean(localStorage.getItem('authToken')?.trim())

const clearExpiredSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken')
  }
}

export type CartItem = {
  id: number
  image?: string
  brand?: string
  article?: string
  name?: string
  quantity: number
  price: number
  warehouseName?: string
}

type CartState = {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  // actions
  load: (opts?: { silent?: boolean }) => Promise<void>
  add: (productId: number, qty?: number) => Promise<void>
  addOffer: (productId: number, warehouseRefKey: string, quantity: number) => Promise<void>
  addByOem: (oem: string, name: string, brand: string, qty?: number, price?: number, imageUrl?: string, warehouseName?: string, warehouseRefKey?: string) => Promise<void>
  setQty: (productId: number, qty: number) => Promise<void>
  remove: (productId: number) => Promise<void>
  clearError: () => void
}

type CartResponse = Awaited<ReturnType<typeof getCart>>

const mapCartItems = (cart: CartResponse): CartItem[] =>
  (cart.items || []).map((it) => ({
    id: it.id,
    image: resolveProductImageUrl(it.product?.imageUrl),
    brand: it.product?.brand || '-',
    article: it.product?.sku || it.product?.code || String(it.product?.id),
    name: it.product?.name || '',
    quantity: it.quantity,
    price: Number(it.price ?? it.product?.price ?? 0),
    warehouseName: it.warehouseName,
  }))

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  load: async (opts) => {
    // A cart belongs to an authenticated user. Guests should see an empty cart,
    // not a failed request to a protected endpoint.
    if (!hasAuthToken()) {
      set({ items: [], isLoading: false, error: null })
      return
    }

    try {
      // Тихая перезагрузка не прячет таблицу за «Загрузка...»
      set(opts?.silent ? { error: null } : { isLoading: true, error: null })
      const cart = await getCart()
      set({ items: mapCartItems(cart), isLoading: false })
    } catch (e: any) {
      if (e instanceof CartApiError && (e.status === 401 || e.status === 403)) {
        clearExpiredSession()
        set({
          error: 'Сессия завершилась. Войдите в аккаунт, чтобы открыть корзину.',
          isLoading: false,
          items: [],
        })
        return
      }
      set({ error: e?.message || 'Не удалось загрузить корзину', isLoading: false, items: [] })
    }
  },

  add: async (productId: number, qty: number = 1) => {
    try {
      set({ isLoading: true, error: null })
      await addToCart(productId, qty)
      await get().load()
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка добавления в корзину' })
    } finally {
      set({ isLoading: false })
    }
  },

  addOffer: async (productId, warehouseRefKey, quantity) => {
    try {
      set({ isLoading: true, error: null })
      const cart = await addOfferToCart(productId, warehouseRefKey, quantity)
      set({ items: mapCartItems(cart) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Ошибка добавления в корзину' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  addByOem: async (oem: string, name: string, brand: string, qty: number = 1, price?: number, imageUrl?: string, warehouseName?: string, warehouseRefKey?: string) => {
    try {
      set({ isLoading: true, error: null })
      await addToCartByOem({ oem, name, brand, price, imageUrl, warehouseName, warehouseRefKey, quantity: qty })
      await get().load()
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка добавления в корзину' })
    } finally {
      set({ isLoading: false })
    }
  },

  setQty: async (productId: number, qty: number) => {
    // Оптимистично меняем количество на месте, без перезагрузки всей корзины
    const previous = get().items
    set({
      error: null,
      items: qty > 0
        ? previous.map((it) => (it.id === productId ? { ...it, quantity: qty } : it))
        : previous.filter((it) => it.id !== productId),
    })
    try {
      const cart = await updateCartItem(productId, qty)
      if (cart?.items) {
        set({ items: mapCartItems(cart) })
      }
    } catch (e: any) {
      set({ items: previous, error: e?.message || 'Ошибка обновления количества' })
    }
  },

  remove: async (productId: number) => {
    try {
      set({ error: null })
      await removeCartItem(productId)
      await get().load({ silent: true })
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка удаления' })
    }
  },

  clearError: () => set({ error: null }),
}))
