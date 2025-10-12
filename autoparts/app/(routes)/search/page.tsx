"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useSearchStore } from "@/lib/stores/searchStore";
import SearchResultsTable from "@/components/SearchResultsTable";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import FiltersSidebar from "@/components/FiltersSidebar";
import PaginationButton from "@/components/PaginationWithPrimaryButton";
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function SearchPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersVersion, setFiltersVersion] = useState(0);
  const searchParams = useSearchParams();
  const { 
    search, results, isLoading, query, error,
    detectedType, vehicle, applicableVehicles, selectedCatalog, setSelectedCatalog,
    loadOemApplicableVehicles, loadOemApplicability, resetOemFlow,
    filters, clearResults,
    resetFilters: resetSearchFilters,
    page, pageSize, setPage
  } = useSearchStore();
  const queryParamValue = searchParams?.get('q') ?? '';
  const normalizedQueryParam = queryParamValue.trim();
  const normalizedStoreQuery = (query ?? '').trim();
  const lastExecutedQueryRef = useRef<string | null>(null);

  const { brands, photoOnly } = filters;
  const activeFiltersCount = useMemo(() => {
    let count = brands.length;
    if (photoOnly) count += 1;
    return count;
  }, [brands, photoOnly]);

  // Выполняем поиск при загрузке страницы, если есть параметр q
  useEffect(() => {
    if (
      normalizedStoreQuery === normalizedQueryParam &&
      results.length > 0 &&
      lastExecutedQueryRef.current === null
    ) {
      lastExecutedQueryRef.current = normalizedQueryParam;
      return;
    }

    if (!normalizedQueryParam) {
      if (lastExecutedQueryRef.current !== null) {
        clearResults();
        resetOemFlow();
        lastExecutedQueryRef.current = null;
      }
      return;
    }

    if (
      lastExecutedQueryRef.current === normalizedQueryParam &&
      normalizedStoreQuery === normalizedQueryParam
    ) {
      return;
    }

    lastExecutedQueryRef.current = normalizedQueryParam;
    void search(normalizedQueryParam);
  }, [normalizedQueryParam, normalizedStoreQuery, results.length, search, clearResults, resetOemFlow]);

  // Применяем клиентские фильтры
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (brands.length > 0) {
        const brand = (r.brand || '').trim();
        if (!brand || !brands.includes(brand)) {
          return false;
        }
      }
      if (photoOnly && !r.imageUrl) {
        return false;
      }
      return true;
    });
  }, [results, brands, photoOnly]);

  const totalResults = filteredResults.length;
  const totalPages = totalResults > 0 ? Math.ceil(totalResults / pageSize) : 0;
  const effectivePage = totalPages === 0 ? 0 : Math.min(page, totalPages - 1);

  const paginatedResults = useMemo(() => {
    if (totalResults === 0) return [];
    const start = effectivePage * pageSize;
    const end = start + pageSize;
    return filteredResults.slice(start, end);
  }, [filteredResults, effectivePage, pageSize, totalResults]);

  useEffect(() => {
    if (page !== effectivePage) {
      setPage(effectivePage);
    }
  }, [page, effectivePage, setPage]);

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
          <div className="mb-4 lg:hidden">
            <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Результаты поиска
                  {totalResults > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-500">({totalResults})</span>
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
                    <DrawerClose asChild>
                      <Button
                        type="button"
                        className="w-full bg-orange-500 text-white hover:bg-orange-600"
                      >
                        Показать
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Основной флекс-контейнер */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 pt-4 lg:pt-8">
            {/* Левая колонка – фильтры (только на desktop) */}
            <aside className="hidden lg:block w-full lg:w-1/4">
              <div className="sticky top-28">
                <FiltersSidebar
                  key={`desktop-${filtersVersion}`}
                  onReset={() => {
                    resetSearchFilters();
                    setFiltersVersion((prev) => prev + 1);
                  }}
                />
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
              {isOem && selectedCatalog && applicableVehicles.length > 0 && filteredResults.length === 0 && (
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

              {/* Таблица результатов */}
              <SearchResultsTable
                className="overflow-hidden"
                items={paginatedResults}
                total={totalResults}
                page={effectivePage}
                pageSize={pageSize}
                isLoading={isLoading}
                detectedType={detectedType ?? undefined}
                vehicle={vehicle}
                emptyMessage={query ? `По запросу "${query}" ничего не найдено` : "Введите поисковый запрос"}
              />
              
              {/* Пагинация показываем только если есть результаты */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 md:mt-8 p-4">
                  <PaginationButton
                    page={effectivePage}
                    totalPages={totalPages}
                    onPageChange={(next) => setPage(next)}
                  />
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
