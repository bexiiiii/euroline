"use client"

import { SyntheticEvent, useEffect, useMemo, useState } from "react"
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
    <Carousel
      aria-label="Промо-баннеры и специальные предложения Euroline"
      opts={{ align: "center", loop: true }}
      plugins={[Autoplay({ delay: 3500 })]}
    >
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
                <a
                  href={b.linkUrl || "#"}
                  className="block w-full max-w-5xl sm:max-w-6xl"
                  aria-label={b.title || "Промо-баннер Euroline"}
                  rel={b.linkUrl?.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <div className="relative w-full h-56 sm:h-80 rounded-xl overflow-hidden border border-gray-200 bg-white">
                    <BannerImage banner={b} />
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

type BannerImageProps = {
  banner: Banner
}

const FALLBACK_PLACEHOLDER = (
  <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
    Изображение недоступно
  </div>
)

function BannerImage({ banner }: BannerImageProps) {
  const candidates = useMemo(() => buildImageCandidates(banner.imageUrl), [banner.imageUrl])
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setIndex(0)
    setFailed(false)
  }, [banner.imageUrl])

  const currentSrc = candidates[index]

  if (!currentSrc || failed) {
    return FALLBACK_PLACEHOLDER
  }

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    const next = index + 1
    if (next < candidates.length) {
      setIndex(next)
    } else {
      setFailed(true)
      console.error("Ошибка загрузки изображения баннера:", event.currentTarget.src)
    }
  }

  /* eslint-disable-next-line @next/next/no-img-element */
  const altText = banner.title?.trim() || "Промо-баннер Euroline";

  /* eslint-disable-next-line @next/next/no-img-element */
  return (
    <img
      src={currentSrc}
      alt={altText}
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
}

function buildImageCandidates(rawUrl?: string | null): string[] {
  if (!rawUrl) return []

  const absolute = toAbsoluteUrl(rawUrl)

  try {
    const parsed = new URL(absolute)
    const dir = parsed.pathname.substring(0, parsed.pathname.lastIndexOf('/') + 1)
    const file = parsed.pathname.substring(parsed.pathname.lastIndexOf('/') + 1)
    const query = parsed.search || ''

    const variants = new Set<string>()

    const addVariant = (filename: string) => {
      if (!filename) return
      const normalized = `${parsed.origin}${dir}${filename}${query}`
      variants.add(encodeURI(normalized))
    }

    variants.add(absolute)
    addVariant(file)

    const decoded = safeDecodeURIComponent(file)
    if (decoded !== file) addVariant(decoded)

    const noSpaces = decoded.replace(/\s+/g, '_')
    addVariant(noSpaces)

    const strictSanitized = decoded.replace(/[^a-zA-Z0-9._-]/g, '_')
    addVariant(strictSanitized)

    const collapsed = strictSanitized.replace(/_+/g, '_')
    addVariant(collapsed)

    return Array.from(variants)
  } catch (error) {
    console.error('Не удалось обработать URL баннера', rawUrl, error)
    return [absolute]
  }
}

function toAbsoluteUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  const relative = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${API_BASE}${relative}`
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
