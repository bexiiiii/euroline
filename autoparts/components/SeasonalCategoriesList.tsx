// components/SeasonalCategoriesList.tsx
'use client'
import { FaBatteryFull, FaLightbulb, FaMobile, FaFire } from 'react-icons/fa'
import CategoryCard from './CategoryCard'

const seasonalCategories = [
  { title: 'Аккумуляторы', href: '/categories/batteries', Icon: FaBatteryFull },
  { title: 'Лампы', href: '/categories/lamps', Icon: FaLightbulb },
  { title: 'Портативные ПЗУ', href: '/categories/portable-devices', Icon: FaMobile },
  { title: 'Свечи зажигания', href: '/categories/spark-plugs', Icon: FaFire },
]

export default function SeasonalCategoriesList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {seasonalCategories.map((cat, idx) => (
        <CategoryCard
          key={idx}
          title={cat.title}
          href={cat.href}
          Icon={cat.Icon}
        />
      ))}
    </div>
  )
}