'use client'

import { Building2, CircleDollarSign, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

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
  onReset?: () => void
  showApplyButton?: boolean
  isMobile?: boolean
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
  onReset,
  showApplyButton = true,
  isMobile = false,
}: Props) {
  return (
    <aside
      className={cn(
        'w-full rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm',
        isMobile && 'border-none bg-transparent p-0 shadow-none'
      )}
    >
      <div className={cn('space-y-6', isMobile && 'px-1')}> 
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Фильтры</p>
          <h3 className='text-lg font-semibold text-slate-900'>Подбор товаров недели</h3>
          <p className='text-sm text-slate-500'>Уточните параметры, чтобы быстрее найти нужные позиции.</p>
        </div>

        <section className='space-y-4'>
          <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <p className='text-sm font-medium text-slate-800'>Бренд</p>
                <p className='text-xs text-slate-500'>Например: BOSCH, MAN, Volvo</p>
              </div>
              <Building2 className='h-5 w-5 text-slate-400' />
            </div>
            <div className='relative mt-4'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
              <Input
                placeholder='Название бренда'
                className='h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/40'
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          <div className='flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
            <div>
              <p className='text-sm font-medium text-slate-800'>В наличии на складе</p>
              <p className='text-xs text-slate-500'>Показать только доступные к отгрузке товары</p>
            </div>
            <Switch
              checked={!!inStock}
              onCheckedChange={(value) => setInStock(value ? true : undefined)}
            />
          </div>

          <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4'>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <p className='text-sm font-medium text-slate-800'>Цена, ₸</p>
                <p className='text-xs text-slate-500'>Задайте комфортный диапазон стоимости</p>
              </div>
              <CircleDollarSign className='h-5 w-5 text-slate-400' />
            </div>
            <div className='mt-4 grid grid-cols-2 gap-3'>
              <div className='rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm'>
                <span className='text-xs font-medium uppercase text-slate-500'>От</span>
                <Input
                  type='number'
                  inputMode='numeric'
                  placeholder='0'
                  value={priceFrom ?? ''}
                  onChange={(e) => setPriceFrom(e.target.value === '' ? undefined : parseInt(e.target.value))}
                  className='mt-1 h-9 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
              <div className='rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm'>
                <span className='text-xs font-medium uppercase text-slate-500'>До</span>
                <Input
                  type='number'
                  inputMode='numeric'
                  placeholder='∞'
                  value={priceTo ?? ''}
                  onChange={(e) => setPriceTo(e.target.value === '' ? undefined : parseInt(e.target.value))}
                  className='mt-1 h-9 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
            </div>
          </div>
        </section>

        {showApplyButton && (
          <div className='flex flex-col gap-2 pt-2'>
            {onReset && (
              <Button
                type='button'
                variant='outline'
                className='w-full justify-center border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                onClick={onReset}
              >
                Сбросить фильтры
              </Button>
            )}
            <Button
              type='button'
              className='w-full bg-orange-500 text-white hover:bg-orange-600'
              onClick={onApply}
            >
              Показать товары
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
