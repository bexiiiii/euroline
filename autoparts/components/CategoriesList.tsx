// components/CategoriesList.tsx
'use client'
import { FaOilCan, FaFilter, FaBatteryFull, FaLightbulb, FaSnowflake, FaCarCrash } from 'react-icons/fa'
import CategoryCard from './CategoryCard'

const categories = [
  { title: 'Моторные масла', href: '/categories/oils', Icon: FaOilCan },
  { title: 'Фильтры масляные', href: '/categories/oil-filters', Icon: FaFilter },
  { title: 'Аккумуляторы', href: '/categories/batteries', Icon: FaBatteryFull },
  { title: 'Лампы', href: '/categories/lamps', Icon: FaLightbulb },
  { title: 'Щетки для снега', href: '/categories/snow-brushes', Icon: FaSnowflake },
  { title: 'Шины', href: '/categories/tires', Icon: FaCarCrash },
  // можно продолжить
]

export default function CategoriesList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((cat, idx) => (
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
