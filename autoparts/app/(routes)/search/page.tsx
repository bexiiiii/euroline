"use client"

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useSearchStore } from "@/lib/stores/searchStore";
import AutoPartsTable, { convertSearchItemToAutoPart } from "@/components/TableComponent";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import FiltersSidebar from "@/components/FiltersSidebar";
import PaginationButton from "@/components/PaginationWithPrimaryButton";
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchApi, type BrandRefinementItem, type SearchItem } from "@/lib/api/search";
import AnalogsTable from "@/components/AnalogsTable";
import { toast } from "sonner";

function SearchPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersVersion, setFiltersVersion] = useState(0);
  const [brandItems, setBrandItems] = useState<BrandRefinementItem[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllAnalogs, setShowAllAnalogs] = useState(false);
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [analogFilter, setAnalogFilter] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  const searchParams = useSearchParams();
  const { 
    search, results, isLoading, query, error,
    detectedType, applicableVehicles, selectedCatalog, setSelectedCatalog,
    loadOemApplicableVehicles, loadOemApplicability, resetOemFlow,
    filters, clearResults,
    resetFilters: resetSearchFilters
  } = useSearchStore();

  const { brands, photoOnly } = filters;
  const activeFiltersCount = useMemo(() => {
    let count = brands.length;
    if (photoOnly) count += 1;
    return count;
  }, [brands, photoOnly]);

  // Выполняем поиск при загрузке страницы, если есть параметр q
  useEffect(() => {
    const queryParam = searchParams?.get('q');
    if (queryParam) {
      // Only search if the query parameter has actually changed
      if (queryParam !== query) {
        search(queryParam);
        // Сбрасываем UMAPI данные при новом поиске
        setBrandItems([]);
        // Аналоги будут вычисляться из результатов поиска
      }
    } else {
      // Clear results when there's no query parameter
      clearResults();
      setBrandItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to avoid duplicate searches

  // Загружаем данные из UMAPI, если detectedType === 'OEM'
  useEffect(() => {
    const loadUmapiData = async () => {
      if (detectedType === 'OEM' && query && !loadingBrands) {
        setLoadingBrands(true);
        try {
          const brandsResponse = await searchApi.searchByArticle(query);
          setBrandItems(brandsResponse || []);
          
          // Автоматически загружаем аналоги для первого бренда
        } catch (err) {
          console.error('Failed to load brand items:', err);
        } finally {
          setLoadingBrands(false);
        }
      }
    };

    loadUmapiData();
  }, [detectedType, query]);

  // Применяем клиентские фильтры и конвертируем в AutoPart
  const primaryResults = useMemo(
    () => results.filter((r: SearchItem) => r.catalog !== 'UMAPI_ANALOG'),
    [results]
  );

  const analogResults = useMemo(
    () => results.filter((r: SearchItem) => r.catalog === 'UMAPI_ANALOG'),
    [results]
  );

  const parts = primaryResults
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

  // Фильтрация и пагинация для BrandRefinement
  const filteredBrandItems = brandItems.filter(item => 
    !brandFilter || item.brand.toLowerCase().includes(brandFilter.toLowerCase())
  );
  const displayedBrandItems = showAllBrands ? filteredBrandItems : filteredBrandItems.slice(0, 5);
  
  // Фильтрация и пагинация для Analogs
  const filteredAnalogs = analogResults.filter(analog => 
    !analogFilter || analog.brand.toLowerCase().includes(analogFilter.toLowerCase())
  );
  const displayedAnalogs = showAllAnalogs ? filteredAnalogs : filteredAnalogs.slice(0, 5);

  // OEM flow helpers
  const isOem = detectedType === 'OEM';
  const uniqueCatalogs: { brand: string; catalog: string }[] = isOem
    ? Array.from(new Map(primaryResults.map(r => [
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
          <div className="mb-4 lg:hidden">
            <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Результаты поиска
                  {results && results.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-500">({results.length})</span>
                  )}
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Фильтры
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-1 rounded-full bg-orange-500 px-2 py-0 text-xs text-white">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              <DrawerContent>
                <DrawerHeader className="bg-white">
                  <DrawerTitle className="text-base font-semibold text-slate-900">Фильтры поиска</DrawerTitle>
                  <p className="text-sm text-slate-500">Выберите бренды или включите отображение только с фотографиями.</p>
                </DrawerHeader>
                <DrawerBody className="pb-10">
                  <FiltersSidebar
                    key={filtersVersion}
                    isMobile
                    showApplyButton={false}
                  />
                </DrawerBody>
                <DrawerFooter className="bg-white">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-slate-200 text-slate-600 hover:text-slate-900"
                      onClick={() => {
                        resetSearchFilters();
                        setFiltersVersion((prev) => prev + 1);
                      }}
                    >
                      Сбросить
                    </Button>
                    <Button
                      type="button"
                      className="w-full bg-orange-500 text-white hover:bg-orange-600"
                      onClick={() => setFiltersOpen(false)}
                    >
                      Применить
                    </Button>
                  </div>
                  <DrawerClose asChild>
                    <Button type="button" variant="ghost" className="w-full text-slate-500 hover:text-slate-800">
                      Закрыть
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Основная сетка */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Левая колонка фильтров для десктопа */}
            <aside className="hidden lg:block lg:w-1/4">
              <div className="sticky top-24">
                <FiltersSidebar key={filtersVersion} />
              </div>
            </aside>

            {/* Правая колонка – результаты поиска */}
            <section className="w-full lg:w-3/4">
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

              {/* Таблица с найденными запчастями из UMAPI (BrandRefinement) */}
              {brandItems && brandItems.length > 0 && (
                <div className="rounded-lg border overflow-hidden mt-6">
                  <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Найденные запчасти ({filteredBrandItems.length})
                      </h3>
                      <input
                        type="text"
                        placeholder="Фильтр по бренду"
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Артикул: <span className="font-mono font-medium">{query}</span>
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Фото</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Бренд</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Артикул</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Наименование</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Остатки</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Цена</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Кол-во</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {displayedBrandItems.map((item, idx) => {
                          const stock = Math.floor(Math.random() * 15); // Временно рандомные остатки
                          const itemKey = `brand-${item.article}-${item.brand}-${idx}`;
                          const quantity = quantities[itemKey] || 1;
                          
                          return (
                            <tr key={itemKey} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-center">
                                {item.img ? (
                                  <img 
                                    src={`https://api.umapi.ru${item.img}`}
                                    alt={item.title}
                                    className="w-12 h-12 object-cover rounded mx-auto"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded mx-auto flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">Нет фото</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {item.brand}
                              </td>
                              <td className="px-4 py-2 text-sm font-mono text-gray-900">
                                {item.article}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {item.title}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                  stock > 5 ? 'bg-green-100 text-green-700' : 
                                  stock > 0 ? 'bg-yellow-100 text-yellow-700' : 
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {stock > 0 ? `${stock} шт` : 'Нет в наличии'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                По запросу
                              </td>
                              <td className="px-4 py-2 text-center">
                                <input 
                                  type="number" 
                                  min="1"
                                  max={stock}
                                  value={quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setQuantities(prev => ({
                                      ...prev,
                                      [itemKey]: Math.min(Math.max(1, val), stock)
                                    }));
                                  }}
                                  disabled={stock === 0}
                                  className="w-14 px-2 py-0.5 text-center text-sm border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400"
                                />
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => {
                                    const token = localStorage.getItem('authToken');
                                    if (!token) {
                                      toast.error('Сначала войдите в аккаунт');
                                      return;
                                    }
                                    if (quantity > stock) {
                                      toast.error(`Доступно только ${stock} шт`);
                                      return;
                                    }
                                    toast.success('Товар добавлен в корзину');
                                  }}
                                  disabled={stock === 0}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                  В корзину
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredBrandItems.length > 5 && (
                    <div className="px-6 py-3 bg-gray-50 border-t flex justify-center">
                      <button
                        onClick={() => setShowAllBrands(!showAllBrands)}
                        className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        {showAllBrands ? 'Свернуть' : `Показать все (${filteredBrandItems.length})`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Таблица с аналогами */}
              {analogResults && analogResults.length > 0 && (
                <div className="rounded-lg border overflow-hidden mt-6">
                  <div className="px-6 py-4 bg-orange-50 border-b border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Аналоги и заменители ({filteredAnalogs.length})
                      </h3>
                      <input
                        type="text"
                        placeholder="Фильтр по бренду"
                        value={analogFilter}
                        onChange={(e) => setAnalogFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Альтернативные запчасти для артикула <span className="font-mono font-medium">{query}</span>
                    </p>
                  </div>
                  <AnalogsTable analogs={displayedAnalogs} />
                  {filteredAnalogs.length > 5 && (
                    <div className="px-6 py-3 bg-orange-50 border-t flex justify-center">
                      <button
                        onClick={() => setShowAllAnalogs(!showAllAnalogs)}
                        className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        {showAllAnalogs ? 'Свернуть' : `Показать все (${filteredAnalogs.length})`}
                      </button>
                    </div>
                  )}
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

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-gray-500">Загрузка...</div>}>
      <SearchPage />
    </Suspense>
  );
}
