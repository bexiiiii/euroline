"use client"

import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const categories = [
  { name: "Амортизаторы", image: "/categrories/amortizatory.webp" },
  { name: "Двигатель", image: "/categrories/detali-dvigatelja.webp" },
  { name: "Масла и жидкости", image: "/categrories/masla-i-zhidkosti (2).webp" },
  { name: "Ремини и натяжители", image: "/categrories/remni-i-natjazhiteli (2).webp" },
  { name: "Топливная система", image: "/categrories/toplivnach-sistema.webp" },
  { name: "Трансмиссия", image: "/categrories/transmissija.webp" },
]

const CategoriesCarousel = () => (
  <section className="py-12 md:py-16 bg-[#f5f7fb]">
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
              <CarouselItem
                key={index}
                className="basis-1/1 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <div className="relative h-68 sm:h-72 md:h-85 rounded-md border-1 border-gray-300 bg-[#eef1f6]  ">
                  <div
                    className="pointer-events-none absolute inset-0 rounded-3xl opacity-70"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7) 0%, rgba(238,241,246,0.55) 55%, transparent 100%), radial-gradient(circle at 75% 25%, rgba(255,255,255,0.45) 0%, transparent 60%), radial-gradient(circle at 50% 115%, rgba(214,221,231,0.35) 0%, rgba(214,221,231,0.05) 55%, transparent 95%)",
                    }}
                  />
                  <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <div className="relative mt-4 flex flex-1 items-end justify-center">
                      <div className="relative w-full max-w-[220px] sm:max-w-[260px]">
                        <div className="absolute inset-x-6 bottom-1 h-8 rounded-md bg-black/10 blur-lg" />
                        <Image
                          width={320}
                          height={220}
                          src={category.image}
                          alt={category.name}
                          className="relative z-[1] mx-auto h-[160px] sm:h-[180px] w-auto object-contain drop-shadow-[0_18px_25px_rgba(0,0,0,0.28)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
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
