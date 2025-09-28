"use client"

import Breadcrumbs from "@/components/Breadcrumb";
import WeeklyFiltersSidebar from "@/components/WeeklyFiltersSidebar";
import ItemCardComponent, { Product as UIProduct } from "@/components/ItemCardComponent";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getWeeklyProducts, ProductResponse, WeeklyProductsFilters } from "@/lib/api/products";
import { PaginatedResponse } from "@/lib/api/types";
import { PackageSearch } from "lucide-react";


const items = [
  { label: "Главная", href: "/" },
  { label: "Товары недели", href: "/weekly-product" },
 
]


const PartnersPage = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PaginatedResponse<ProductResponse> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [size, setSize] = useState(12);

  // filters
  const [brandInput, setBrandInput] = useState<string>("");
  const [inStock, setInStock] = useState<boolean | undefined>(undefined);
  const [priceFrom, setPriceFrom] = useState<number | undefined>(undefined);
  const [priceTo, setPriceTo] = useState<number | undefined>(undefined);

  const filters: WeeklyProductsFilters = useMemo(() => ({
    brands: brandInput ? [brandInput] : undefined,
    inStock,
    priceFrom,
    priceTo,
    sort: 'id,desc'
  }), [brandInput, inStock, priceFrom, priceTo]);

  const load = useCallback(async (page = currentPage) => {
    setError(null);
    setLoading(true);
    try {
      const resp = await getWeeklyProducts(page, size, filters);
      setPageData(resp);
      setCurrentPage(resp.number);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [currentPage, size, filters]);

  useEffect(() => {
    load(0);
  }, [filters, size, load]);

  const uiProducts: UIProduct[] | undefined = useMemo(() => {
    if (!pageData) return undefined;
    return pageData.content.map((p, idx) => ({
      id: p.id,
      brand: p.brand || '-',
      article: p.code || String(p.id),
      description: p.description || p.name,
      stockLocation: p.warehouses?.[0]?.name || 'Главный склад',
      availability: (p.stock ?? 0) > 0 ? 'На складе' : 'Ожидается',
      quantity: (p.stock ?? 0) > 50 ? '>50 шт.' : `${p.stock ?? 0} шт.`,
      price: p.price ?? 0,
      image: p.imageUrl || 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-10.png',
    }));
  }, [pageData]);

  return (
    <div className="bg-gray-100 min-h-screen pt-20 md:pt-24">
      <main className="container mx-auto px-4 md:px-6">
        <div className="pt-3 md:pt-5">
            <Breadcrumbs items={items} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold pt-6 md:pt-8">Товар недели</h1>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 pt-6">
            
          {/* Фильтры - мобильная версия (floating overlay) */}
          <div className="lg:hidden">
            {/* Иконка фильтров */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Фильтры</span>
              </button>
            </div>

            {/* Overlay backdrop */}
            {filtersOpen && (
              <div className="fixed inset-0 bg-white z-50 w-screen h-screen">
                {/* Header панели */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white w-full">
                  <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content панели с прокруткой */}
                <div className="flex flex-col h-full w-full">
                  <div className="flex-1 overflow-y-auto p-4 pb-24 w-full">
                    <WeeklyFiltersSidebar
                      brand={brandInput}
                      setBrand={setBrandInput}
                      inStock={inStock}
                      setInStock={setInStock}
                      priceFrom={priceFrom}
                      setPriceFrom={setPriceFrom}
                      priceTo={priceTo}
                      setPriceTo={setPriceTo}
                      onApply={() => { setFiltersOpen(false); load(0); }}
                      showApplyButton={false}
                    />
                  </div>

                  {/* Кнопка применить внизу */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 w-full">
                    <button
                      onClick={() => { setFiltersOpen(false); load(0); }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Применить фильтры
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
            
          {/* Левая колонка — фильтры (desktop) */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-28 pt-2">
              <WeeklyFiltersSidebar
                brand={brandInput}
                setBrand={setBrandInput}
                inStock={inStock}
                setInStock={setInStock}
                priceFrom={priceFrom}
                setPriceFrom={setPriceFrom}
                priceTo={priceTo}
                setPriceTo={setPriceTo}
                onApply={() => load(0)}
              />
            </div>
          </aside>
          
          {/* Правая колонка — карточки */}
          <section className="flex-1 min-w-0">
            {/* Адаптивная сетка карточек */}
            <div className="space-y-4 md:space-y-0">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
              )}
              {/* Пустое состояние */}
              {!loading && pageData && pageData.numberOfElements === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
                  <PackageSearch className="w-12 h-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-800">Нет товаров</h3>
                  <p className="mt-1 text-sm text-gray-500">Попробуйте изменить фильтры или очистить их.</p>
                </div>
              )}
              {/* Грид товаров */}
              {pageData && pageData.numberOfElements > 0 && (
                <ItemCardComponent products={uiProducts} />
              )}
              {loading && (
                <div className="text-center py-6 text-gray-500">Загрузка...</div>
              )}
            </div>
            
            {/* Простая пагинация */}
            {pageData && pageData.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6 md:mt-8">
                <button disabled={currentPage<=0} onClick={()=>load(currentPage-1)} className="px-3 py-2 border rounded disabled:opacity-50">Назад</button>
                <span className="text-sm">Стр. {currentPage+1} / {pageData.totalPages}</span>
                <button disabled={currentPage>=pageData.totalPages-1} onClick={()=>load(currentPage+1)} className="px-3 py-2 border rounded disabled:opacity-50">Вперед</button>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
};

export default PartnersPage;
