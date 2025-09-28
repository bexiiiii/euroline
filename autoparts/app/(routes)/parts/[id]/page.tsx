import Breadcrumbs from "@/components/Breadcrumb";
import ImageGallery from "@/components/ImageGalleryComponent";
import { PartInfoTableComponent } from "@/components/PartInfoTableComponent";
import { GetStartedButton } from "@/components/ui/get-started-button";

const items = [
  { label: "Главная", href: "/" },
  { label: "Артикуль", isCurrent: true },
];

export default function Home() {
  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
        </div>

        <h1 className="text-4xl font-bold pt-4 pb-6">2310916 COJALI</h1>

        {/* Flex-контейнер для галереи и таблицы */}
        <section className="flex flex-col lg:flex-row gap-8 pb-6">
          {/* Левая колонка — изображения */}
          <div className="w-full lg:w-1/2">
            <ImageGallery />
            <h1 className="text-3xl font-bold pt-10">
              <span className="text-gray-800 font-bold"> 2310916 kzt</span> 
            </h1>
             
            
            <div className="mt-4">
              <GetStartedButton />
            </div>
          </div>

          {/* Правая колонка — таблица */}
           <div className="w-full lg:w-1/2 max-w-md pb-10">
            <PartInfoTableComponent />
          </div>
          <p className="text-xs text-blue-600 mt-1 underline cursor-pointer">
  Показать аналоги
</p>
        </section>
        <div>
          
        </div>
      </main>
    </div>
  );
}
