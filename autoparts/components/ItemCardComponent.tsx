'use client'

import { useState } from 'react'
import { HeartIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardDescription, CardTitle, CardFooter, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
  image: string
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

  return (
    <div className='relative w-full rounded-md bg-white hover:shadow-md border border-gray-200 hover:border-gray-300'>
      <div className='flex h-40 items-center justify-center'>
        <img src={product.image} alt={product.description} className='w-32 object-contain' />
      </div>

      <Button
        size='icon'
        onClick={() => setLiked(!liked)}
        className='bg-primary/10 hover:bg-primary/20 absolute end-4 top-4 rounded-full'
      >
        <HeartIcon className={cn('size-4', liked ? 'fill-destructive stroke-destructive' : 'stroke-white')} />
        <span className='sr-only'>Like</span>
      </Button>

      <Card className='border-none'>
        <CardHeader>
          <CardTitle className="text-lg font-bold">{product.brand}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Артикул: {product.article}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-sm">{product.description}</p>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Склад:</span> {product.stockLocation}</p>
            <p><span className="font-medium">Срок:</span> {product.availability}</p>
            <p><span className="font-medium">Наличие:</span> {product.quantity}</p>
          </div>
        </CardContent>

        <CardFooter className='justify-between items-center'>
          <div className='flex flex-col'>
            <span className='text-sm text-muted-foreground'>Цена</span>
            <span className='text-xl font-bold'>{product.price.toLocaleString()} тг</span>
          </div>
          <Button size='sm'>В корзину</Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {list.map((product) => (
          <CardProductDemo key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default ProductGridPage
