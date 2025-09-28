"use client";

import DisplayCards from "@/components/ui/display-cards";
import { Store, Wrench, Truck, ShoppingCart, Shield, Clock } from "lucide-react";

const autoPartsCards = [
  {
    icon: <Store className="size-4 text-blue-300" />,
    title: "Для магазинов",
    description: "Широкий ассортимент запчастей",
    date: "Надежный поставщик",
    iconClassName: "text-blue-500",
    titleClassName: "text-blue-500",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Wrench className="size-4 text-green-300" />,
    title: "Для СТО",
    description: "Инструменты и оборудование",
    date: "Автосервисам",
    iconClassName: "text-green-500",
    titleClassName: "text-green-500",
    className:
      "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Truck className="size-4 text-purple-300" />,
    title: "Для автопарков",
    description: "Сбалансированные программы",
    date: "Корпоративным клиентам",
    iconClassName: "text-purple-500",
    titleClassName: "text-purple-500",
    className:
      "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
  },
];

function AutoPartsDisplayCards() {
  return (
    <div className="flex min-h-[600px] w-full items-center justify-center py-16">
      <div className="w-full max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            ALATRADE - надежный партнер для вашего бизнеса
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-8">
            Мы работаем с различными типами клиентов, предоставляя индивидуальные решения для каждого сегмента рынка
          </p>
        </div>
        
        <div className="mb-16">
          <DisplayCards cards={autoPartsCards} />
        </div>

       
      </div>
    </div>
  );
}

export { AutoPartsDisplayCards };
