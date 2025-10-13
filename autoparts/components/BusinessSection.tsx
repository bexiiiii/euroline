"use client";

import Image from "next/image";
import Link from "next/link";
import GradientButton from "./ui/button-1";


const BusinessSection = () => {
  const benefits = [
    {
      title: "Оптовая торговля",
      description: "Электронная торговая платформа ETP для бизнеса",
      image: "/partners/frame-178057023.webp",
    },
    {
      title: "Широкий ассортимент",
      description: "Более 7000 брендов и 60 млн. позиций в наличии и под заказ",
      image: "/partners/frame-178057024.webp",
    },
    {
      title: "Развитая логистика",
      description:
        "Оптимальное использование ресурсов транспортной системы, снижение издержек и оптимизация поставок",
      image: "/partners/frame-178057027.webp",
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-gray-900 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Заголовок + кнопка */}
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-6 md:mb-0">
            Преимущества для бизнес-клиентов
          </h2>
          <div>
            <Link href="https://wa.me/77782504727" target="_blank">
              <GradientButton
                onClick={() => console.log("clicked")}
                width="220px"
                height="48px"
                disabled={false}
              >
                Оптовым покупателям
              </GradientButton>
            </Link>
          </div>
        </div>

        {/* Карточки преимуществ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all hover:-translate-y-1 duration-300"
            >
              {/* Картинка */}
              <div className="relative h-40 sm:h-48 w-full">
                <Image
                  src={benefit.image}
                  alt={benefit.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* Текст */}
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-white/80 leading-relaxed text-sm sm:text-base">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BusinessSection;
