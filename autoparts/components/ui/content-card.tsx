"use client"

import { cn } from "@/lib/utils"

interface AuthorCardProps {
  className?: string
  backgroundImage?: string
  author: {
    name: string
    
    readTime?: string
  }
  content: {
    title: string
    description: string
  }
}

export const AuthorCard = ({ 
  className,
  backgroundImage,
  author,
  content
}: AuthorCardProps) => {
  return (
    <div className="w-full group/card">
      <div
        className={cn(
          "cursor-pointer overflow-hidden relative h-96 rounded-xl flex flex-col justify-between p-5 bg-gray-900",
          className
        )}
      >
        {/* Фото масштабируется отдельно от текста, чтобы при наведении не дёргалась вёрстка. */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover/card:scale-105"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {/* Постоянное затемнение: без него текст не читается на светлых фото. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/85 transition-colors duration-300 group-hover/card:bg-black/20" />
        <div className="relative z-10 flex flex-col">
          <p className="font-medium text-sm text-white/90">
            {author.name}
          </p>
          {author.readTime && (
            <p className="text-xs text-white/70">{author.readTime}</p>
          )}
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-lg md:text-xl leading-snug text-white line-clamp-3">
            {content.title}
          </h3>
          <p className="mt-2 font-normal text-sm leading-relaxed text-white/85 line-clamp-3">
            {content.description}
          </p>
        </div>
      </div>
    </div>
  )
}
