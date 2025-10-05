"use client"

import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useMemo, useState } from 'react'

interface CategoryFiltersSidebarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedBrands: string[]
  onBrandsChange: (brands: string[]) => void
  inStock?: boolean
  onInStockChange: (value: boolean | undefined) => void
  priceFrom?: number
  onPriceFromChange: (value: number | undefined) => void
  priceTo?: number
  onPriceToChange: (value: number | undefined) => void
  onApply: () => void
  availableBrands?: string[]
}

const CategoryFiltersSidebar = ({
  searchQuery,
  onSearchChange,
  selectedBrands,
  onBrandsChange,
  inStock,
  onInStockChange,
  priceFrom,
  onPriceFromChange,
  priceTo,
  onPriceToChange,
  onApply,
  availableBrands = []
}: CategoryFiltersSidebarProps) => {
  const [brandQuery, setBrandQuery] = useState('')
  const [tempPriceFrom, setTempPriceFrom] = useState<string>(priceFrom?.toString() || '')
  const [tempPriceTo, setTempPriceTo] = useState<string>(priceTo?.toString() || '')

  const visibleBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase()
    if (!q) return availableBrands
    return availableBrands.filter(b => b.toLowerCase().includes(q))
  }, [availableBrands, brandQuery])

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter(b => b !== brand))
    } else {
      onBrandsChange([...selectedBrands, brand])
    }
  }

  const handlePriceApply = () => {
    const from = tempPriceFrom ? parseFloat(tempPriceFrom) : undefined
    const to = tempPriceTo ? parseFloat(tempPriceTo) : undefined
    onPriceFromChange(from)
    onPriceToChange(to)
    onApply()
  }

  const clearFilters = () => {
    onSearchChange('')
    onBrandsChange([])
    onInStockChange(undefined)
    setTempPriceFrom('')
    setTempPriceTo('')
    onPriceFromChange(undefined)
    onPriceToChange(undefined)
    onApply()
  }

  return (
    <aside className='px-6 w-full max-w-xs bg-white rounded-md p-4 border-1'>
      
      {/* Поиск */}
      <Label className='font-semibold'>Поиск</Label>
      <Input 
        placeholder='Поиск товаров...' 
        className='my-2' 
        value={searchQuery} 
        onChange={e => onSearchChange(e.target.value)} 
      />

      <Separator className='my-4' />

      {/* Производители */}
      <Label className='font-semibold'>Производители</Label>
      <Input 
        placeholder='Поиск бренда' 
        className='my-2' 
        value={brandQuery} 
        onChange={e => setBrandQuery(e.target.value)} 
      />
      <ScrollArea className='max-h-64 pr-2'>
        {visibleBrands.map((brand) => (
          <div key={brand} className='flex items-center space-x-2 my-1'>
            <Checkbox 
              id={`brand-${brand}`} 
              checked={selectedBrands.includes(brand)} 
              onCheckedChange={() => toggleBrand(brand)} 
            />
            <label htmlFor={`brand-${brand}`} className='text-sm cursor-pointer'>
              {brand}
            </label>
          </div>
        ))}
        {visibleBrands.length === 0 && (
          <div className='text-xs text-gray-500 py-2'>
            {availableBrands.length === 0 ? 'Загрузка брендов...' : 'Бренды не найдены'}
          </div>
        )}
      </ScrollArea>

      <Separator className='my-4' />

      {/* Наличие */}
      <Label className='font-semibold'>Наличие</Label>
      <div className='space-y-2 mt-2'>
        <div className='flex items-center space-x-2'>
          <Checkbox 
            id='all-stock' 
            checked={inStock === undefined} 
            onCheckedChange={() => onInStockChange(undefined)} 
          />
          <label htmlFor='all-stock' className='text-sm cursor-pointer'>
            Все товары
          </label>
        </div>
        <div className='flex items-center space-x-2'>
          <Checkbox 
            id='in-stock' 
            checked={inStock === true} 
            onCheckedChange={() => onInStockChange(true)} 
          />
          <label htmlFor='in-stock' className='text-sm cursor-pointer'>
            В наличии
          </label>
        </div>
        <div className='flex items-center space-x-2'>
          <Checkbox 
            id='out-of-stock' 
            checked={inStock === false} 
            onCheckedChange={() => onInStockChange(false)} 
          />
          <label htmlFor='out-of-stock' className='text-sm cursor-pointer'>
            Нет в наличии
          </label>
        </div>
      </div>

      <Separator className='my-4' />

      {/* Цена */}
      <Label className='font-semibold'>Цена, ₸</Label>
      <div className='space-y-2 mt-2'>
        <Input 
          placeholder='От' 
          type='number'
          value={tempPriceFrom}
          onChange={e => setTempPriceFrom(e.target.value)}
        />
        <Input 
          placeholder='До' 
          type='number'
          value={tempPriceTo}
          onChange={e => setTempPriceTo(e.target.value)}
        />
        <Button 
          onClick={handlePriceApply} 
          size="sm" 
          className='w-full'
        >
          Применить цену
        </Button>
      </div>

      <Separator className='my-4' />

      {/* Кнопки действий */}
      <div className='space-y-2'>
        <Button onClick={onApply} className='w-full'>
          Применить фильтры
        </Button>
        <Button onClick={clearFilters} variant="outline" className='w-full'>
          Сбросить все
        </Button>
      </div>
    </aside>
  )
}

export default CategoryFiltersSidebar