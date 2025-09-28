// components/CategoryCard.tsx
'use client'

import Link from 'next/link'
import { FC } from 'react'
import { IconType } from 'react-icons'

interface CategoryCardProps {
  title: string
  href: string
  Icon: IconType
  active?: boolean
}

const CategoryCard: FC<CategoryCardProps> = ({ title, href, Icon, active = false }) => {
  return (
    <Link href={href}>
      <div
        className={`flex items-center justify-between p-4 md:p-5 border rounded-md transition  
        ${active ? 'bg-orange-50 border-orange-400' : 'bg-white'}
        hover:shadow-md hover:border-orange-300 cursor-pointer h-full`}
      >
        <div className="text-base sm:text-lg font-medium text-gray-800 hover:text-orange-500">{title}</div>
        <Icon className={`text-3xl sm:text-4xl ${active ? 'text-orange-500' : 'text-gray-700'}`} />
      </div>
    </Link>
  )
}

export default CategoryCard
