import Breadcrumbs from "@/components/Breadcrumb";
import OilAndChemicalsGrid from "@/components/OilAndChemicalsGrid";
import { Oi } from "next/font/google";



const items = [
  { label: "Главная", href: "/" },
  { label: "Масло и автохимия", isCurrent: true },
];



function HelpPage() {
  return (
    <div className="bg-white min-h-screen pt-20 md:pt-24">
      <main className="container mx-auto px-4 md:px-6">
        <div className="pt-3 md:pt-5">
          <Breadcrumbs items={items} />
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold pt-3 md:pt-4">Масло и автохимия</h1>
        <section className="mt-6 md:mt-8 lg:mt-10 mb-6 md:mb-8 lg:mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6">
      <OilAndChemicalsGrid

        title="Сезонные товары"
        link="/seasonal-products"
        mainImage="/oil-and-chemicals/Sezonnie_tovary_211124.jpg"
        subcategories={[
          { title: "Аккумуляторы", image: "/oil-and-chemicals/image_11.jpg", href: "/accumulators" },
          { title: "Лампы", image: "/oil-and-chemicals/image_12.jpg", href: "/lamps" },
          { title: "Портативные ПЗУ", image: "/oil-and-chemicals/image_13.jpg", href: "/pzu" },
          { title: "Свечи зажигания", image: "/oil-and-chemicals/image_14.jpg", href: "/spark" },
        ]}
      />
      <OilAndChemicalsGrid
        title="Автохимия"
        link="/auto-chemicals"
        mainImage="/oil-and-chemicals/Avtohimia_211124.jpg"
        subcategories={[
          { title: "Антифризы", image: "/oil-and-chemicals/image_21.jpg", href: "/antifreeze" },
          { title: "Тормозные жидкости", image: "/oil-and-chemicals/image_22.jpg", href: "/brake-fluids" },
          { title: "Присадки в масло", image: "/oil-and-chemicals/image_23.jpg", href: "/oil-additives" },
          { title: "Антикоры", image: "/oil-and-chemicals/image_24.jpg", href: "/anticorrosion" },
        ]}
      />
      <OilAndChemicalsGrid
        title="Масла и технические жидкости"
        link="/oil-and-chemicals"
        mainImage="/oil-and-chemicals/Masla_211124.jpg"
        subcategories={[
          { title: "Моторные масла", image: "/oil-and-chemicals/image_31.jpg", href: "/motor-oils" },
          { title: "Жидкости ГУР", image: "/oil-and-chemicals/image_32.jpg", href: "/power-steering-fluids" },
          { title: "Жидкости и средства", image: "/oil-and-chemicals/image_33.jpg", href: "/fluids-and-agents" },
          { title: "Трансмиссионные масла", image: "/oil-and-chemicals/image_34.jpg", href: "/transmission-oils" },
        ]}
      />
      <OilAndChemicalsGrid
        title="Шины"
        link="/tires"
        mainImage="/oil-and-chemicals/Shiny_211124.jpg"
      />
      <OilAndChemicalsGrid
        title="Щетки стеклоочистителя"
        link="/wiper-blades"
        mainImage="/oil-and-chemicals/Shetky_211124.jpg"
      />
      {/* Ещё карточки */}
    </div>
        </section>
      </main>
    </div>
  );
}

export default HelpPage;
