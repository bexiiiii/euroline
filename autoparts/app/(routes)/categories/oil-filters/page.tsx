import CategoriesList from "@/components/CategoriesList";
import PartnersPage from "../../weekly-product/page";
import Breadcrumbs from "@/components/Breadcrumb";
import FiltersSidebar from "@/components/FiltersSidebar";
import ItemCardComponent from "@/components/ItemCardComponent";
import PaginationButton from "@/components/PaginationWithPrimaryButton";

const items = [
  { label: "Главная", href: "/" },
  { label: "Товары недели", href: "/weekly-product" },
 
]


const OilsPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
            <Breadcrumbs items={items} />
        </div>
        <h1 className="text-3xl font-bold pt-8">Фильтры масляные</h1>
        <section className="mt-10 mb-10">
           <div className="flex gap-6">
            
          {/* Левая колонка — фильтры */}
          <section className="pt-16 pb-8">
            <FiltersSidebar />
          </section>
          
          {/* Правая колонка — карточки */}
          <section className="flex-1">
            
              {/* Моки карточек */}
              <ItemCardComponent />
            <div className="flex justify-center mt-8">
                {/* Кнопка пагинации */}
                <PaginationButton />
            </div>
              
          </section>

        </div>
        </section>
      </main>
    </div>
  );
}

export default OilsPage;
