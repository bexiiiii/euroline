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
      <SearchSection />
       <CarouselComponent />

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
