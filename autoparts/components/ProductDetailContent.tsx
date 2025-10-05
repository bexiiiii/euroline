"use client"

import { useMemo, useState } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/constants'
import { useCartStore } from '@/lib/stores/cartStore'
import { toast } from 'sonner'

export interface ProductDetailWarehouse {
  name?: string
  quantity?: number
}

export interface ProductDetailProperty {
  propertyName: string
  propertyValue: string
}

export interface ProductDetailViewModel {
  id?: number
  article: string
  name: string
  code: string
  description?: string
  brand?: string
  imageUrl?: string
  price?: number
  stock: number
  warehouses: ProductDetailWarehouse[]
  properties: ProductDetailProperty[]
}

const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return '—'
  return `${value.toLocaleString('ru-RU')} ₸`
}

export function ProductDetailContent({ product }: { product: ProductDetailViewModel }) {
  const [imageSrc, setImageSrc] = useState(product.imageUrl || DEFAULT_PRODUCT_IMAGE)
  const [quantity, setQuantity] = useState(product.stock > 0 ? 1 : 0)
  const maxQuantity = useMemo(() => {
    if (product.stock <= 0) return 0
    return Math.max(1, Math.min(product.stock, 99))
  }, [product.stock])

  const { add, addByOem } = useCartStore()
  const hasStock = product.stock > 0

  const handleDecrease = () => {
    if (!hasStock) return
    setQuantity((current) => Math.max(1, current - 1))
  }

  const handleIncrease = () => {
    if (!hasStock) return
    setQuantity((current) => Math.min(maxQuantity, current + 1))
  }

  const handleAddToCart = async () => {
    if (!hasStock) {
      toast.error('Товар отсутствует на складе')
      return
    }

    try {
      if (product.id) {
        await add(product.id, quantity || 1)
      } else {
        await addByOem(product.article, product.name, product.brand ?? '', quantity || 1, product.price ?? 0, imageSrc)
      }
      toast.success('Товар добавлен в корзину')
    } catch (error) {
      toast.error('Не удалось добавить товар в корзину')
    }
  }

  const availabilityBadge = useMemo(() => {
    if (!hasStock) {
      return <Badge variant="destructive">Нет в наличии</Badge>
    }
    if (product.stock > 50) {
      return <Badge className="bg-green-100 text-green-700">Много на складе</Badge>
    }
    if (product.stock > 10) {
      return <Badge className="bg-yellow-100 text-yellow-700">Ограниченное количество</Badge>
    }
    return <Badge className="bg-orange-100 text-orange-700">Заканчивается</Badge>
  }, [hasStock, product.stock])

  const totalWarehouseCount = product.warehouses.reduce((sum, item) => sum + (item.quantity ?? 0), 0)

  return (
    <section className="mt-6 grid grid-cols-1 gap-8 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm md:grid-cols-[1.1fr_1.3fr]">
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImageSrc(DEFAULT_PRODUCT_IMAGE)}
          />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-600">
         <p>
            <span className="font-medium text-slate-800">Артикул:</span> {product.article || product.code || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-800">Бренд:</span> {product.brand || '—'}
          </p>
          <p>
            <span className="font-medium text-slate-800">Общее наличие:</span> {product.stock}
            {totalWarehouseCount > 0 && product.stock !== totalWarehouseCount && (
              <span className="text-xs text-slate-500"> (по складам: {totalWarehouseCount})</span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{product.name}</h1>
              {product.description && (
                <p className="mt-2 text-sm text-slate-600">{product.description}</p>
              )}
            </div>
            {availabilityBadge}
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-sm text-slate-500">Цена</p>
              <p className="text-3xl font-semibold text-slate-900">{formatPrice(product.price)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
          <p className="text-sm font-medium text-slate-800">Количество</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={!hasStock || quantity <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[2.5rem] text-center text-lg font-semibold">{hasStock ? quantity : 0}</span>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={!hasStock || quantity >= maxQuantity}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={!hasStock}
              className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <ShoppingCart className="h-5 w-5" />
              Добавить в корзину
            </Button>
          </div>
          {!hasStock && (
            <p className="text-xs text-slate-500">Товар временно отсутствует. Попробуйте выбрать другой склад или уточните сроки поставки у менеджера.</p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Наличие по складам</h2>
          {product.warehouses.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {product.warehouses.map((warehouse, index) => (
                <div
                  key={`${warehouse.name}-${index}`}
                  className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <p className="font-medium text-slate-800">{warehouse.name || 'Склад'} </p>
                  <p className="text-xs text-slate-500">На складе: {warehouse.quantity ?? 0} шт.</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Информация по складам отсутствует.</p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Характеристики</h2>
          {product.properties.length > 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <dl className="divide-y divide-slate-100 text-sm">
                {product.properties.map((property, index) => (
                  <div key={`${property.propertyName}-${index}`} className="flex items-start gap-4 px-4 py-3">
                    <dt className="w-40 shrink-0 font-medium text-slate-600">{property.propertyName}</dt>
                    <dd className="flex-1 text-slate-800">{property.propertyValue}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Характеристики для этого товара пока не добавлены.</p>
          )}
        </div>
      </div>
    </section>
  )
}
