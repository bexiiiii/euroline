"use client"

import { useEffect, useState } from "react"
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay"
import { getActiveBanners, type Banner } from "@/lib/api/banners"
import { API_BASE } from "@/lib/api/base"

const CarouselComponent = () => {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const page = await getActiveBanners(0, 10)
        setBanners(page.content)
      } catch {
        setBanners([])
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const slides = (banners && banners.length>0) ? banners : []

  return (
    <Carousel opts={{ align: "center", loop: true }} plugins={[ Autoplay({ delay: 3500 }) ]}>
      <div className="container mx-auto px-4 sm:px-6">
        <CarouselContent>
          {slides.length === 0 && !loading && (
            <CarouselItem>
              <div className="flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-5xl sm:max-w-6xl bg-white h-56 sm:h-80 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500">
                  Баннеры отсутствуют
                </div>
              </div>
            </CarouselItem>
          )}
          {slides.map((b) => (
            <CarouselItem key={b.id}>
              <div className="flex items-center justify-center p-4 sm:p-6">
                <a href={b.linkUrl || '#'} className="block w-full max-w-5xl sm:max-w-6xl">
                  <div className="relative w-full h-56 sm:h-80 rounded-xl overflow-hidden border border-gray-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.imageUrl?.startsWith('/') ? `${API_BASE}${b.imageUrl}` : (b.imageUrl || '')} alt={b.title || ''} className="w-full h-full object-cover" />
                    {b.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/35 text-white p-3 text-sm sm:text-base">
                        {b.title}
                      </div>
                    )}
                  </div>
                </a>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </div>
    </Carousel>
  )
}

export default CarouselComponent
