"use client"

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useSearchStore } from "@/lib/stores/searchStore";
import AutoPartsTable, { convertSearchItemToAutoPart } from "@/components/TableComponent";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import FiltersSidebar from "@/components/FiltersSidebar";
import PaginationButton from "@/components/PaginationWithPrimaryButton";

function SearchPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchParams = useSearchParams();
  const { 
    search, results, isLoading, query, error,
    detectedType, applicableVehicles, selectedCatalog, setSelectedCatalog,
    loadOemApplicableVehicles, loadOemApplicability, resetOemFlow,
    filters
  } = useSearchStore();

  // Выполняем поиск при загрузке страницы, если есть параметр q
  useEffect(() => {
    const queryParam = searchParams?.get('q');
    if (queryParam && queryParam !== query) {
      search(queryParam);
    }
  }, [searchParams, search, query]);

  // Применяем клиентские фильтры и конвертируем в AutoPart
  const parts = results
    .filter(r => {
      // brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(r.brand)) {
        return false;
      }
      // photo only
      if (filters.photoOnly && !r.imageUrl) {
        return false;
      }
      return true;
    })
    .map(convertSearchItemToAutoPart);

  // OEM flow helpers
  const isOem = detectedType === 'OEM';
  const uniqueCatalogs: { brand: string; catalog: string }[] = isOem
    ? Array.from(new Map(results.map(r => [
        `${r.brand}|${r.catalog}`,
        { brand: r.brand, catalog: r.catalog }
      ])).values())
    : [];

  const handlePickCatalog = async (pair: { brand: string; catalog: string }) => {
    setSelectedCatalog(pair);
    const oem = query;
    if (oem) await loadOemApplicableVehicles(pair.catalog, oem, pair.brand);
  };

  const handlePickVehicle = async (ssd: string) => {
    if (!selectedCatalog) return;
    const oem = query;
    await loadOemApplicability(selectedCatalog.catalog, ssd, oem, selectedCatalog.brand);
  };

  // Автовыбор, если найден ровно один каталог
  useEffect(() => {
    if (isOem && uniqueCatalogs.length === 1 && !selectedCatalog && !isLoading) {
      handlePickCatalog(uniqueCatalogs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOem, uniqueCatalogs.length, selectedCatalog, isLoading]);

  return (
    <div className="bg-white min-h-screen pt-20 md:pt-24">
      <main className="mx-auto max-w-screen-2xl px-4 md:px-6">
        <div className="p-3 md:p-6">
          <h1 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center">Поиск</h1>
          <p className="text-center text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
            Найдите нужные автозапчасти с помощью умного поиска.
          </p>

          <div className="mb-6 md:mb-8">
            <ActionSearchBar />
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Мобильные фильтры */}
          <div className="lg:hidden mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">
                Результаты поиска
                {results && results.length > 0 && (
                  <span className="ml-2 text-gray-500">({results.length})</span>
                )}
              </h2>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Фильтры</span>
              </button>
            </div>

            {/* Полноэкранная панель фильтров */}
            {filtersOpen && (
              <div className="fixed inset-0 bg-white z-50 w-screen h-screen">
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

                <div className="flex flex-col h-full w-full">
                  <div className="flex-1 overflow-y-auto p-4 pb-24 w-full">
                    <FiltersSidebar />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 w-full">
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Применить фильтры
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Основной флекс-контейнер */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 pt-4 lg:pt-8">
            {/* Левая колонка – фильтры (только на desktop) */}
            <aside className="hidden lg:block w-full lg:w-1/4">
              <div className="sticky top-28">
                <FiltersSidebar />
              </div>
            </aside>

            {/* Правая колонка – результаты поиска */}
            <section className="w-full lg:w-3/4">
              {/* OEM step 1: выбрать каталог */}
              {isOem && !selectedCatalog && (
                <div className="rounded-lg border p-4 md:p-6 mb-4">
                  <h3 className="text-lg font-semibold mb-3">Выберите производителя/каталог</h3>
                  <p className="text-sm text-gray-600 mb-4">Для OEM «{query}» найдены варианты. Выберите бренд и каталог.</p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCatalogs.map((pair) => (
                      <button
                        key={`${pair.brand}|${pair.catalog}`}
                        onClick={() => handlePickCatalog(pair)}
                        className="px-3 py-2 text-sm rounded border hover:bg-gray-50"
                        title={pair.catalog}
                      >
                        <span className="font-medium">{pair.brand}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-700">{pair.catalog}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* OEM step 2: применимые автомобили */}
              {isOem && selectedCatalog && applicableVehicles.length > 0 && parts.length === 0 && (
                <div className="rounded-lg border overflow-hidden mb-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-100 text-gray-700 text-sm font-medium">
                    <div className="w-1/4">Бренд</div>
                    <div className="w-1/5">Артикул</div>
                    <div className="w-16 hidden md:block">Фото</div>
                    <div className="flex-1">Название</div>
                    <div className="w-44 text-right">Действие</div>
                  </div>
                  <div>
                    {applicableVehicles.map((v, idx) => (
                      <button
                        key={`${v.ssd}-${idx}`}
                        onClick={() => handlePickVehicle(v.ssd)}
                        className="w-full text-left border-t hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                      >
                        <div className="flex items-center px-4 py-3">
                          <div className="w-1/4 font-semibold uppercase text-gray-900 truncate">{selectedCatalog.brand}</div>
                          <div className="w-1/5 font-medium text-gray-900">{query}</div>
                          <div className="w-16 hidden md:flex items-center justify-center">
                            <div className="w-8 h-8 rounded bg-gray-200" />
                          </div>
                          <div className="flex-1 text-gray-800 pr-4 truncate">{v.name}</div>
                          <div className="w-44 text-right text-blue-600 font-medium flex items-center justify-end gap-2">
                            Узнать наличие
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2 bg-white border-t flex justify-between items-center">
                    <p className="text-sm text-gray-500">Найдено вариантов: {applicableVehicles.length}</p>
                    <button className="text-sm text-blue-600 hover:underline" onClick={() => { resetOemFlow(); }}>Сменить каталог</button>
                  </div>
                </div>
              )}

              {/* Таблица показываем по умолчанию и на финальном шаге OEM */}
              {(!isOem || (isOem && selectedCatalog && parts.length > 0)) && (
                <div className="rounded-lg border overflow-hidden">
                  <AutoPartsTable
                    parts={parts}
                    isLoading={isLoading}
                    emptyMessage={query ? `По запросу "${query}" ничего не найдено` : 'Введите поисковый запрос'}
                  />
                </div>
              )}
              
              {/* Пагинация показываем только если есть результаты */}
              {results && results.length > 0 && (
                <div className="flex justify-center mt-6 md:mt-8 p-4">
                  <PaginationButton />
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SearchPage;
