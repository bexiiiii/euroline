import { create } from 'zustand'
import { addToCart, addToCartByOem, getCart, removeFromCart, updateQuantity } from '@/lib/api/cart'

export type CartItem = {
  id: number
  image?: string
  brand?: string
  article?: string
  name?: string
  quantity: number
  price: number
}

type CartState = {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  // actions
  load: () => Promise<void>
  add: (productId: number, qty?: number) => Promise<void>
  addByOem: (oem: string, name: string, brand: string, qty?: number, price?: number, imageUrl?: string) => Promise<void>
  setQty: (productId: number, qty: number) => Promise<void>
  remove: (productId: number) => Promise<void>
  clearError: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  load: async () => {
    try {
      set({ isLoading: true, error: null })
      const cart = await getCart()
      const mapped: CartItem[] = (cart.items || []).map((it) => ({
        id: it.product?.id as number,
        image: it.product?.imageUrl || 'https://via.placeholder.com/64',
        brand: it.product?.brand || '-',
        article: it.product?.code || String(it.product?.id),
        name: it.product?.name || '',
        quantity: it.quantity,
        price: it.product?.price ?? 0,
      }))
      set({ items: mapped, isLoading: false })
    } catch (e: any) {
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

  addByOem: async (oem: string, name: string, brand: string, qty: number = 1, price?: number, imageUrl?: string) => {
    try {
      set({ isLoading: true, error: null })
      await addToCartByOem({ oem, name, brand, price, imageUrl, quantity: qty })
      await get().load()
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка добавления в корзину' })
    } finally {
      set({ isLoading: false })
    }
  },

  setQty: async (productId: number, qty: number) => {
    try {
      set({ error: null })
      await updateQuantity(productId, qty)
      await get().load()
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка обновления количества' })
    }
  },

  remove: async (productId: number) => {
    try {
      set({ error: null })
      await removeFromCart(productId)
      await get().load()
    } catch (e: any) {
      set({ error: e?.message || 'Ошибка удаления' })
    }
  },

  clearError: () => set({ error: null }),
}))
