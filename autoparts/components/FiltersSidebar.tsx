"use client"

import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useMemo, useState } from 'react'
import { useSearchStore } from '@/lib/stores/searchStore'

const manufacturers = ['4RIDE', 'AAA', 'ABSEL', 'AC/DC', 'ACDELCO']
const programs = ['Грузовые запчасти', 'Легковые запчасти', 'Мотозапчасти']
const voltages = ['6', '12', '24']
const capacities = ['0.8', '1000']
const polarities = [
  '0 обратная (-/+)',
  '1 прямая (+/-)',
  '2 диагональная (+/-)',
  '3 боковая обратная (+/-)',
  '4 боковая прямая (-/+)',
  '5 универсальная (±/±)',
]
const startingCurrents = ['7', '8750']
const dimensions = {
  Длина: ['35', '1200'],
  Ширина: ['24', '1896'],
  Высота: ['16', '1790'],
}
const terminalTypes = [
  'A конус стандартные',
  'B конус тонкие (Азия)',
  'E винтовые (Европа)',
  'F винтовые (Америка)',
  'G под болт (Америка)',
]
const batteryTypes = ['AGM', 'AGM+GEL', 'Ca/Ca', 'EFB', 'GEL']
const mountTypes = ['B00 без выступов', 'B01 с 2 сторон', 'B03 с 4 сторон', 'B13 с 4 сторон', 'Korean B1']
const features = [
  'для автомобилей с функцией "Старт-Стоп"',
  'защита от утечки',
  'необслуживаемый',
  'устойчивость к вибрации',
  'устойчивость к циклам',
]

const FiltersSidebar = () => {
  const { results, filters, toggleBrand, setPhotoOnly } = useSearchStore()
  // Бренды берём из результатов, чтобы фильтр был релевантен
  const allBrands = useMemo(() => {
    const set = new Set<string>()
    results.forEach(r => { if (r.brand) set.add(r.brand) })
    return Array.from(set).sort()
  }, [results])

  const [brandQuery, setBrandQuery] = useState('')
  const visibleBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase()
    if (!q) return allBrands
    return allBrands.filter(b => b.toLowerCase().includes(q))
  }, [allBrands, brandQuery])

  return (
    <aside className='px-6 w-full max-w-xs bg-white rounded-md p-4 border-1'>
     
        {/* Производители */}
        <Label className='font-semibold'>Производители</Label>
        <Input placeholder='Поиск' className='my-2' value={brandQuery} onChange={e => setBrandQuery(e.target.value)} />
        <ScrollArea className='max-h-64 pr-2'>
          {visibleBrands.map((m) => (
            <div key={m} className='flex items-center space-x-2 my-1'>
              <Checkbox id={`brand-${m}`} checked={filters.brands.includes(m)} onCheckedChange={() => toggleBrand(m)} />
              <label htmlFor={`brand-${m}`} className='text-sm'>
                {m}
              </label>
            </div>
          ))}
          {visibleBrands.length === 0 && (
            <div className='text-xs text-gray-500 py-2'>Бренды не найдены</div>
          )}
        </ScrollArea>

        <Separator className='my-4' />

        {/* Программа */}
        <Label className='font-semibold'>Программа</Label>
        {programs.map((p) => (
          <div key={p} className='flex items-center space-x-2 my-1'>
            <Checkbox id={p} />
            <label htmlFor={p} className='text-sm'>
              {p}
            </label>
          </div>
        ))}

        <Separator className='my-4' />

        {/* Напряжение */}
        <Label className='font-semibold'>Напряжение, В</Label>
        {voltages.map((v) => (
          <div key={v} className='flex items-center space-x-2 my-1'>
            <Checkbox id={`voltage-${v}`} />
            <label htmlFor={`voltage-${v}`} className='text-sm'>
              {v}
            </label>
          </div>
        ))}

        <Separator className='my-4' />

        {/* Полярность */}
        <Label className='font-semibold'>Полярность</Label>
        <Input placeholder='Поиск' className='my-2' />
        {polarities.map((p) => (
          <div key={p} className='flex items-center space-x-2 my-1'>
            <Checkbox id={p} />
            <label htmlFor={p} className='text-sm'>
              {p}
            </label>
          </div>
        ))}

        <Separator className='my-4' />

        {/* Тип клемм */}
        <Label className='font-semibold'>Тип клемм</Label>
        <Input placeholder='Поиск' className='my-2' />
        {terminalTypes.map((t) => (
          <div key={t} className='flex items-center space-x-2 my-1'>
            <Checkbox id={t} />
            <label htmlFor={t} className='text-sm'>
              {t}
            </label>
          </div>
        ))}

        <Separator className='my-4' />

        {/* Тип АКБ */}
        <Label className='font-semibold'>Тип АКБ</Label>
        <Input placeholder='Поиск' className='my-2' />
        {batteryTypes.map((t) => (
          <div key={t} className='flex items-center space-x-2 my-1'>
            <Checkbox id={t} />
            <label htmlFor={t} className='text-sm'>
              {t}
            </label>
          </div>
        ))}

        <Separator className='my-4' />

        {/* Тип крепления */}
        <Label className='font-semibold'>Тип крепления</Label>
        {mountTypes.map((m) => (
          <div key={m} className='flex items-center space-x-2 my-1'>
            <Checkbox id={m} />
            <label htmlFor={m} className='text-sm'>
              {m}
            </label>
          </div>
        ))}

        <Separator className='my-4' />

        {/* Особенности */}
        <Label className='font-semibold'>Особенности</Label>
        <Input placeholder='Поиск' className='my-2' />
        {features.map((f) => (
          <div key={f} className='flex items-center space-x-2 my-1'>
            <Checkbox id={f} />
            <label htmlFor={f} className='text-sm'>
              {f}
            </label>
          </div>
        ))}

        <Separator className='my-4' />

        {/* Только с фото */}
        <div className='flex items-center space-x-2'>
          <Checkbox id='photo' checked={filters.photoOnly} onCheckedChange={(v) => setPhotoOnly(!!v)} />
          <label htmlFor='photo' className='text-sm'>
            Только с фото
          </label>
        </div>
     
    </aside>
  )
}

export default FiltersSidebar
