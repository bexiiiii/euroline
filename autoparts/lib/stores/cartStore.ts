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

// 1С не присылает бренд и фото: у таких товаров бренд "1C" и пустое фото.
// При добавлении из поиска запоминаем бренд/фото из результата и показываем их в корзине.
type CartDisplay = { brand?: string; image?: string }
const DISPLAY_KEY = 'cart-product-display'

const readDisplay = (): Record<string, CartDisplay> => {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(DISPLAY_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const rememberDisplay = (productId: number, display?: CartDisplay) => {
  if (!display || typeof window === 'undefined') return
  try {
    const all = readDisplay()
    all[productId] = { ...all[productId], ...display }
    localStorage.setItem(DISPLAY_KEY, JSON.stringify(all))
  } catch {
    // нет доступа к localStorage — покажем то, что пришло с сервера
  }
}

const isPlaceholderBrand = (brand?: string) => !brand?.trim() || brand.trim().toUpperCase() === '1C'

/** Бренд товара 1С обычно первым словом названия: "WABCO 4410329212 датчик…", "SAF-HOLLAND …". */
const brandFromName = (name?: string) => {
  const first = name?.trim().split(/\s+/)[0] ?? ''
  return /^[A-Za-z][A-Za-z0-9-]+$/.test(first) && /[A-Za-z]{2}/.test(first) ? first : undefined
}

type CartState = {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  // actions
  load: (opts?: { silent?: boolean }) => Promise<void>
  add: (productId: number, qty?: number) => Promise<void>
  addOffer: (productId: number, warehouseRefKey: string, quantity: number, display?: CartDisplay) => Promise<void>
  addByOem: (oem: string, name: string, brand: string, qty?: number, price?: number, imageUrl?: string, warehouseName?: string, warehouseRefKey?: string) => Promise<void>
  setQty: (productId: number, qty: number) => Promise<void>
  remove: (productId: number) => Promise<void>
  clearError: () => void
}

type CartResponse = Awaited<ReturnType<typeof getCart>>

const mapCartItems = (cart: CartResponse): CartItem[] => {
  const display = readDisplay()
  return (cart.items || []).map((it) => {
    const saved: CartDisplay = (it.product?.id != null && display[it.product.id]) || {}
    const brand = !isPlaceholderBrand(it.product?.brand) ? it.product?.brand
      : (!isPlaceholderBrand(saved.brand) ? saved.brand : brandFromName(it.product?.name))
    return {
      id: it.id,
      image: resolveProductImageUrl(it.product?.imageUrl || saved.image),
      brand: brand || '-',
      article: it.product?.sku || it.product?.code || String(it.product?.id),
      name: it.product?.name || '',
      quantity: it.quantity,
      price: Number(it.price ?? it.product?.price ?? 0),
      warehouseName: it.warehouseName,
    }
  })
}

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

  addOffer: async (productId, warehouseRefKey, quantity, display) => {
    try {
      set({ isLoading: true, error: null })
      rememberDisplay(productId, display)
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
