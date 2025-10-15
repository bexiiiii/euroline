import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import SearchSection from "@/components/SearchSection";
import CarouselComponent from "@/components/CarouselComponent";
import CategoriesCarousel from "@/components/CategoriesCarousel";
import BusinessSection from "@/components/BusinessSection";
import BrandsCarousel from "@/components/BrandsCarousel";
import PromoSection from "@/components/PromoSection";
import NewsSection from "@/components/NewsSection";
import AboutSection from "@/components/AboutSection";

export const metadata: Metadata = {
  title: "Euroline — запчасти, масла и автохимия для коммерческого транспорта",
  description:
    "Подберите запчасти, масла и расходники для грузовых автомобилей с Euroline. Проверенные склады, официальные поставки и доставка по Казахстану.",
};

const HomePage = () => {
  return (
    <div className="bg-gray-50">
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800/90 to-slate-900"
          aria-hidden="true"
        />
        <Container className="relative z-10 space-y-6 py-16 sm:py-20 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-400/80">
            Euroline
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Оригинальные и проверенные запчасти для коммерческого транспорта по всему Казахстану
          </h1>
          <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
            Мы помогаем сервисам, логистическим компаниям и владельцам автопарков быстро находить
            запасные части, масла и расходники. Складская программа, подбор по VIN и консультации
            специалистов — в одном месте.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalogs"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-orange-600"
            >
              Перейти в каталог
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10"
            >
              Связаться с нами
            </Link>
          </div>
        </Container>
      </section>

      <SearchSection />

      <section aria-labelledby="special-offers-heading" className="bg-white py-12 sm:py-16">
        <Container>
          <div className="mb-6 text-center sm:mb-10">
            <h2 id="special-offers-heading" className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Актуальные предложения и акции
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Следите за новыми поставками и спецпредложениями от Euroline
            </p>
          </div>
          <CarouselComponent />
        </Container>
      </section>

      <CategoriesCarousel />
      <BusinessSection />
      <BrandsCarousel />
      <PromoSection />
      <NewsSection />
      <AboutSection />
    </div>
  );
};

export default HomePage;
