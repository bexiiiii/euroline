"use client"

import { useMemo, useState } from 'react'
import { Building2, Check, Image as ImageIcon, Search as SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useSearchStore } from '@/lib/stores/searchStore'

interface FiltersSidebarProps {
  onApply?: () => void
  onReset?: () => void
  showApplyButton?: boolean
  isMobile?: boolean
}

const FiltersSidebar = ({
  onApply,
  onReset,
  showApplyButton = true,
  isMobile = false,
}: FiltersSidebarProps) => {
  const { results, filters, toggleBrand, setPhotoOnly } = useSearchStore()

  const allBrands = useMemo(() => {
    const unique = new Set<string>()
    results.forEach((item) => {
      if (item.brand) {
        unique.add(item.brand)
      }
    })
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [results])

  const [brandQuery, setBrandQuery] = useState('')

  const visibleBrands = useMemo(() => {
    const query = brandQuery.trim().toLowerCase()
    if (!query) return allBrands
    return allBrands.filter((brand) => brand.toLowerCase().includes(query))
  }, [allBrands, brandQuery])

  const handleBrandToggle = (brand: string) => {
    toggleBrand(brand)
  }

  const handleReset = () => {
    setBrandQuery('')
    onReset?.()
  }

  const hasBrands = visibleBrands.length > 0

  return (
    <aside
      className={cn(
        'w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm',
        isMobile && 'border-none bg-transparent p-0 shadow-none'
      )}
    >
      <div className={cn('space-y-6', isMobile && 'px-1 pb-2')}> 
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Фильтрация</p>
          <h3 className='text-lg font-semibold text-slate-900'>Уточните результаты поиска</h3>
          <p className='text-sm text-slate-500'>Выберите популярные бренды или показывайте только товары с фотографиями.</p>
        </div>

        <section className='space-y-4'>
          <div className='rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4'>
            <div className='flex items-center justify-between gap-2'>
              <div>
                <p className='text-sm font-medium text-slate-800'>Производитель</p>
                <p className='text-xs text-slate-500'>Отметьте бренды, которые хотите видеть в списке</p>
              </div>
              <Building2 className='h-5 w-5 text-slate-400' />
            </div>
            <div className='mt-4 space-y-3'>
              <div className='relative'>
                <SearchIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <Input
                  placeholder='Поиск бренда'
                  value={brandQuery}
                  onChange={(event) => setBrandQuery(event.target.value)}
                  className='h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/40'
                />
              </div>
              <ScrollArea className='max-h-56 pr-1'>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {hasBrands ? (
                    visibleBrands.map((brand) => {
                      const selected = filters.brands.includes(brand)
                      return (
                        <button
                          key={brand}
                          type='button'
                          onClick={() => handleBrandToggle(brand)}
                          className={cn(
                            'flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors',
                            selected
                              ? 'border-orange-500 bg-orange-50 text-orange-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          )}
                        >
                          <span className='truncate'>{brand}</span>
                          {selected && <Check className='h-4 w-4' />}
                        </button>
                      )
                    })
                  ) : (
                    <p className='rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-center text-xs text-slate-500'>
                      Бренды не найдены по запросу
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className='flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4'>
            <div>
              <p className='text-sm font-medium text-slate-800'>Только товары с фото</p>
              <p className='text-xs text-slate-500'>Скрывать позиции без изображений</p>
            </div>
            <div className='flex items-center gap-2'>
              <ImageIcon className='h-4 w-4 text-slate-400' />
              <Switch
                checked={filters.photoOnly}
                onCheckedChange={(value) => setPhotoOnly(!!value)}
              />
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
                onClick={handleReset}
              >
                Сбросить фильтры
              </Button>
            )}
            <Button
              type='button'
              className='w-full bg-orange-500 text-white hover:bg-orange-600'
              onClick={() => onApply?.()}
            >
              Показать результаты
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default FiltersSidebar
