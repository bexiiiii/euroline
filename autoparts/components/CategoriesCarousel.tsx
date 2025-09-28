"use client"

import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const categories = [
  { name: 'Амортизаторы', image: '/api/placeholder/300/200', color: 'from-red-500 to-red-600' },
  { name: 'Двигатель', image: '/api/placeholder/300/200', color: 'from-blue-500 to-blue-600' },
  { name: 'Масла и жидкости', image: '/api/placeholder/300/200', color: 'from-yellow-500 to-yellow-600' },
  { name: 'Диски и шины', image: '/api/placeholder/300/200', color: 'from-gray-500 to-gray-600' },
   { name: 'Диски и шины', image: '/api/placeholder/300/200', color: 'from-gray-500 to-gray-600' },
    { name: 'Диски и шины', image: '/api/placeholder/300/200', color: 'from-gray-500 to-gray-600' },
]

const CategoriesCarousel = () => (
  <section className="py-12 md:py-16 bg-white">
    <div className="container mx-auto px-4 sm:px-6">
      <h2 className="text-2xl sm:text-4xl font-bold text-orange-500 mb-2">
        Для грузовых автомобилей
      </h2>
      <p className="text-gray-600 mb-8 sm:mb-12 font-bold text-xl sm:text-3xl">
        Популярные категории
      </p>

      <div className="relative">
        <Carousel>
          <CarouselContent>
            {categories.map((category, index) => (
              <CarouselItem key={index} className="basis-1/1 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                <Link href={`/category/${category.name.toLowerCase()}`} className="group block">
                  <div className="relative h-56 sm:h-72 md:h-80 rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80`} />
                    <div className="absolute inset-0 flex items-end">
                      <div className="p-4 sm:p-6 w-full">
                        <h3 className="text-white text-lg sm:text-xl font-semibold">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  </section>
)

export default CategoriesCarousel
