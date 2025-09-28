'use client'

import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

type Props = {
  brand: string
  setBrand: (v: string) => void
  inStock?: boolean
  setInStock: (v: boolean | undefined) => void
  priceFrom?: number
  setPriceFrom: (v: number | undefined) => void
  priceTo?: number
  setPriceTo: (v: number | undefined) => void
  onApply: () => void
  showApplyButton?: boolean
}

export default function WeeklyFiltersSidebar({
  brand,
  setBrand,
  inStock,
  setInStock,
  priceFrom,
  setPriceFrom,
  priceTo,
  setPriceTo,
  onApply,
  showApplyButton = true,
}: Props) {
  return (
    <aside className='px-6 w-full max-w-xs bg-white rounded-md p-4 border-1'>
      <div className='space-y-4'>
        {/* Бренд */}
        <div>
          <Label className='font-semibold'>Бренд</Label>
          <Input
            placeholder='например, BOSCH'
            className='my-2'
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <Separator />

        {/* Только в наличии */}
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='only-in-stock'
            checked={!!inStock}
            onCheckedChange={(val) => setInStock(val ? true : undefined)}
          />
          <label htmlFor='only-in-stock' className='text-sm'>
            Только в наличии
          </label>
        </div>

        <Separator />

        {/* Цена */}
        <div>
          <Label className='font-semibold'>Цена</Label>
          <div className='mt-2 grid grid-cols-2 gap-2'>
            <Input
              type='number'
              placeholder='от'
              value={priceFrom ?? ''}
              onChange={(e) => setPriceFrom(e.target.value === '' ? undefined : parseInt(e.target.value))}
            />
            <Input
              type='number'
              placeholder='до'
              value={priceTo ?? ''}
              onChange={(e) => setPriceTo(e.target.value === '' ? undefined : parseInt(e.target.value))}
            />
          </div>
        </div>

        {showApplyButton && (
          <div className='pt-2'>
            <Button className='w-full' onClick={onApply}>Применить</Button>
          </div>
        )}
      </div>
    </aside>
  )
}

