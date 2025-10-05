'use client'

import { useEffect, useState } from 'react'
import { HeartIcon, Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardDescription, CardTitle, CardFooter, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/stores/cartStore'
import { toast } from 'sonner'
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/constants'

// Типизация продукта

export interface Product {
  id: number
  brand: string
  article: string
  description: string
  stockLocation: string
  availability: string
  quantity: string
  price: number
  image?: string
}

// Моковые данные
const mockProducts: Product[] = [
  {
    id: 1,
    brand: 'VICTOR REINZ',
    article: '12-37804-01',
    description: 'Маслосьемный колпачок Volvo FH13 /D13A/ Цена за 1 шт.',
    stockLocation: 'Карабулак (Шымкент)',
    availability: 'На складе',
    quantity: '>50 шт.',
    price: 450.00,
    image: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-11.png',
  },
  {
    id: 2,
    brand: 'ELRING',
    article: '577.210',
    description: 'Прокладка ГБЦ Mercedes Actros OM501LA',
    stockLocation: 'Алматы',
    availability: 'На складе',
    quantity: '12 шт.',
    price: 1950.00,
    image: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-10.png',
  },
  {
    id: 3,
    brand: 'BOSCH',
    article: '0 445 120 236',
    description: 'Форсунка топливная DAF XF105',
    stockLocation: 'Астана',
    availability: 'Ожидается',
    quantity: '0 шт.',
    price: 32500.00,
    image: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-9.png',
  },
  {
    id: 4,
    brand: 'BOSCH',
    article: '0 445 120 236',
    description: 'Форсунка топливная DAF XF105',
    stockLocation: 'Астана',
    availability: 'Ожидается',
    quantity: '0 шт.',
    price: 32500.00,
    image: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-9.png',
  },
  {
    id: 5,
    brand: 'BOSCH',
    article: '0 445 120 236',
    description: 'Форсунка топливная DAF XF105',
    stockLocation: 'Астана',
    availability: 'Ожидается',
    quantity: '0 шт.',
    price: 32500.00,
    image: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-9.png',
  },
  {
    id: 6,
    brand: 'BOSCH',
    article: '0 445 120 236',
    description: 'Форсунка топливная DAF XF105',
    stockLocation: 'Астана',
    availability: 'Ожидается',
    quantity: '0 шт.',
    price: 32500.00,
    image: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-9.png',
  },
]

// Компонент карточки
const CardProductDemo = ({ product }: { product: Product }) => {
  const [liked, setLiked] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [imgSrc, setImgSrc] = useState(
    product.image && product.image.trim() ? product.image : DEFAULT_PRODUCT_IMAGE
  )
  const { add } = useCartStore()

  // Парсим количество на складе
  const stockQuantity = parseInt(product.quantity.replace(/[^0-9]/g, '')) || 0
  const isOutOfStock = stockQuantity <= 0
  const isInStock = product.availability === 'На складе' && stockQuantity > 0

  const handleQuantityChange = (delta: number) => {
    const stockQuantity = parseInt(product.quantity.replace(/[^0-9]/g, '')) || 0
    const maxQuantity = stockQuantity > 0 ? Math.min(stockQuantity, 99) : 1
    setQuantity(prev => Math.max(1, Math.min(maxQuantity, prev + delta)))
  }

  useEffect(() => {
    setImgSrc(product.image && product.image.trim() ? product.image : DEFAULT_PRODUCT_IMAGE)
  }, [product.image])

  const handleImageError = () => setImgSrc(DEFAULT_PRODUCT_IMAGE)

  const handleAddToCart = async () => {
    const stockQuantity = parseInt(product.quantity.replace(/[^0-9]/g, '')) || 0
    
    if (stockQuantity <= 0) {
      toast.error('Товар отсутствует на складе')
      return
    }
    
    if (quantity > stockQuantity) {
      toast.error(`Доступно только ${stockQuantity} шт.`)
      return
    }
    
    setIsAdding(true)
    try {
      await add(product.id, quantity)
      toast.success(`Добавлено в корзину: ${quantity} шт.`)
    } catch (error) {
      toast.error('Ошибка при добавлении в корзину')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className='relative w-full rounded-md bg-white hover:shadow-md border border-gray-200 hover:border-gray-300 h-full flex flex-col'>
      <div className='flex h-32 items-center justify-center overflow-hidden'>
        <img
          src={imgSrc}
          alt={product.description}
          className='w-24 h-24 object-contain'
          onError={handleImageError}
          loading='lazy'
        />
      </div>

      <Button
        size='icon'
        onClick={() => setLiked(!liked)}
        className='bg-primary/10 hover:bg-primary/20 absolute end-4 top-4 rounded-full'
      >
        <HeartIcon className={cn('size-4', liked ? 'fill-destructive stroke-destructive' : 'stroke-white')} />
        <span className='sr-only'>Like</span>
      </Button>

      <Card className='border-none flex-1 flex flex-col'>
        <CardHeader className='pb-2'>
          <CardTitle className="text-base font-bold">{product.brand}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Артикул: {product.article}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-1 flex-1">
          <p className="text-sm font-medium text-gray-700 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.description}</p>
          <div className="text-sm space-y-0.5 text-gray-700">
            <p><span className="font-semibold text-gray-800">Склад:</span> {product.stockLocation}</p>
            <p><span className="font-semibold text-gray-800">Срок:</span> {product.availability}</p>
            <p><span className="font-semibold text-gray-800">Наличие:</span> {product.quantity}</p>
          </div>
        </CardContent>

        <CardFooter className='flex-col gap-2 mt-auto pt-2'>
          <div className='flex justify-between items-center w-full'>
            <div className='flex flex-col'>
              <span className='text-xs text-muted-foreground'>Цена</span>
              <span className='text-lg font-bold'>{product.price.toLocaleString()} тг</span>
            </div>
            <div className='flex items-center gap-1'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || isOutOfStock}
                className='h-7 w-7 p-0'
              >
                <Minus className='h-3 w-3' />
              </Button>
              <span className='min-w-[1.5rem] text-center text-sm font-medium'>{quantity}</span>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleQuantityChange(1)}
                disabled={isOutOfStock}
                className='h-7 w-7 p-0'
              >
                <Plus className='h-3 w-3' />
              </Button>
            </div>
          </div>
          <Button 
            size='sm' 
            className='w-full h-8 text-sm' 
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
          >
            {isAdding ? 'Добавление...' : 'В корзину'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Страница с гридом
const ProductGridPage = ({ products }: { products?: Product[] }) => {
  // Если products передан (даже пустой), используем его. Иначе — мок.
  const list = products ?? mockProducts
  return (
    <div className="pt-16 px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((product) => (
          <div key={product.id} className="h-full">
            <CardProductDemo product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductGridPage
