"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const NewsSection = () => {
  const newsItems = [
    { title: 'Новость 1', date: '2025-01-20' },
    { title: 'Новость 2', date: '2025-01-19' },
    { title: 'Новость 3', date: '2025-01-18' },
    { title: 'Новость 4', date: '2025-01-17' },
    { title: 'Новость 5', date: '2025-01-16' },
  ];

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-8 sm:mb-12">
          Новости
        </h2>

        <div className="relative">
          <Carousel>
            <CarouselContent>
              {newsItems.map((item, index) => (
                <CarouselItem key={index} className="basis-1/1 sm:basis-1/2 md:basis-1/3 lg:basis-1/3">
                  <article className="group">
                    <div className="h-48 sm:h-72 md:h-96 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4 group-hover:shadow-xl transition-shadow" />
                    <div className="bg-white rounded-b-xl p-4 sm:p-6 -mt-4 relative z-10">
                      <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <time className="text-gray-600 text-xs sm:text-sm">
                        {new Date(item.date).toLocaleDateString('ru-RU')}
                      </time>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
