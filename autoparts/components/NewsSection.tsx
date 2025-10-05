"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useNewsFeed } from "@/hooks/useNewsFeed"
import Link from "next/link"
import { AuthorCard } from "@/components/ui/content-card"

const NewsSection = () => {
  const { news, loading, error } = useNewsFeed({ limit: 6 })

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">Новости</h2>
            <p className="mt-2 text-gray-500 text-sm sm:text-base">Последние обновления и новости компании</p>
          </div>
          <Link
            href="/news"
            className="text-xl font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            Смотреть все новости →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-red-600">
            Не удалось загрузить новости. Попробуйте обновить страницу позже.
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-gray-500">
            Пока нет опубликованных новостей.
          </div>
        ) : (
          <div className="relative">
            <Carousel opts={{ align: "start" }}>
              <CarouselContent>
                {news.map((item) => (
                  <CarouselItem
                    key={item.id}
                    className="basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 px-2"
                  >
                    <Link href={`/news/${item.id}`} className="block">
                      <AuthorCard
                        className="h-80"
                        backgroundImage={item.coverImageUrl || "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1651&q=80"}
                        author={{
                            name: "Новости компании",
                          readTime: new Date(item.createdAt).toLocaleDateString('ru-RU')
                        }}
                        content={{
                          title: item.title,
                          description: item.description || `${item.content.slice(0, 90)}${item.content.length > 90 ? '…' : ''}`
                        }}
                      />
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsSection;
