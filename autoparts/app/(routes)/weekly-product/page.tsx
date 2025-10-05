"use client"

import Breadcrumbs from "@/components/Breadcrumb";
import WeeklyFiltersSidebar from "@/components/WeeklyFiltersSidebar";
import ItemCardComponent, { Product as UIProduct } from "@/components/ItemCardComponent";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api/base";
import { getWeeklyProducts, ProductResponse, WeeklyProductsFilters } from "@/lib/api/products";
import { PaginatedResponse } from "@/lib/api/types";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const items = [
  { label: "Главная", href: "/" },
  { label: "Товары недели", href: "/weekly-product" },
];

const WeeklyProductsPage = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PaginatedResponse<ProductResponse> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [size, setSize] = useState(12);

  const [brandInput, setBrandInput] = useState<string>("");
  const [inStock, setInStock] = useState<boolean | undefined>(undefined);
  const [priceFrom, setPriceFrom] = useState<number | undefined>(undefined);
  const [priceTo, setPriceTo] = useState<number | undefined>(undefined);

  const filters: WeeklyProductsFilters = useMemo(() => ({
    brands: brandInput ? [brandInput] : undefined,
    inStock,
    priceFrom,
    priceTo,
    sort: 'id,desc',
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

  const resetFilters = useCallback(() => {
    setBrandInput('');
    setInStock(undefined);
    setPriceFrom(undefined);
    setPriceTo(undefined);
  }, []);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (brandInput.trim()) count += 1;
    if (inStock) count += 1;
    if (typeof priceFrom === 'number') count += 1;
    if (typeof priceTo === 'number') count += 1;
    return count;
  }, [brandInput, inStock, priceFrom, priceTo]);

  useEffect(() => {
    load(0);
  }, [filters, size, load]);

  const uiProducts: UIProduct[] | undefined = useMemo(() => {
    if (!pageData) return undefined;
    return pageData.content.map((p) => ({
      id: p.id,
      brand: p.brand || '-',
      article: p.code || String(p.id),
      description: p.description || p.name,
      stockLocation: p.warehouses?.[0]?.name || 'Главный склад',
      availability: (p.stock ?? 0) > 0 ? 'На складе' : 'Ожидается',
      quantity: (p.stock ?? 0) > 50 ? '>50 шт.' : `${p.stock ?? 0} шт.`,
      price: p.price ?? 0,
      image: p.imageUrl
        ? (p.imageUrl.startsWith('http') ? p.imageUrl : `${API_BASE}${p.imageUrl}`)
        : undefined,
    }));
  }, [pageData]);

  const handleResetAndReload = useCallback(() => {
    resetFilters();
    load(0);
  }, [resetFilters, load]);

  return (
    <div className="bg-gray-100 min-h-screen pt-20 md:pt-24">
      <main className="container mx-auto px-4 md:px-6">
        <div className="pt-3 md:pt-5">
          <Breadcrumbs items={items} />
        </div>
        <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-end md:justify-between">
          <h1 className="text-2xl font-bold md:text-3xl">Товар недели</h1>
          
        </div>

        <div className="flex flex-col gap-4 pt-6 lg:flex-row lg:gap-6">
          <div className="lg:hidden">
            <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
              <div className="mb-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-full border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Фильтры
                  {activeFilters > 0 && (
                    <Badge className="ml-1 rounded-full bg-orange-500 px-2 py-0 text-xs text-white">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </div>

              <DrawerContent>
                <DrawerHeader className="bg-white">
                  <DrawerTitle className="text-base font-semibold text-slate-900">Фильтры для «Товар недели»</DrawerTitle>
                  <p className="text-sm text-slate-500">Настройте параметры, чтобы подобрать предложения под ваш запрос.</p>
                </DrawerHeader>
                <DrawerBody className="pb-10">
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
                    onReset={resetFilters}
                    showApplyButton={false}
                    isMobile
                  />
                </DrawerBody>
                <DrawerFooter className="bg-white">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-slate-200 text-slate-600 hover:text-slate-900"
                      onClick={handleResetAndReload}
                    >
                      Сбросить
                    </Button>
                    <DrawerClose asChild>
                      <Button
                        type="button"
                        className="w-full bg-orange-500 text-white hover:bg-orange-600"
                        onClick={() => load(0)}
                      >
                        Показать
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          <aside className="hidden w-80 shrink-0 lg:block">
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
                onReset={handleResetAndReload}
              />
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            <div className="space-y-4 md:space-y-0">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
              )}
              {!loading && pageData && pageData.numberOfElements === 0 && !error && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
                  <PackageSearch className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-800">Нет товаров</h3>
                  <p className="mt-1 max-w-xs text-sm text-gray-500">Измените параметры фильтра или сбросьте их, чтобы увидеть другие предложения.</p>
                </div>
              )}
              {pageData && pageData.numberOfElements > 0 && (
                <ItemCardComponent products={uiProducts} />
              )}
              {loading && (
                <div className="py-6 text-center text-gray-500">Загрузка...</div>
              )}
            </div>

            {pageData && pageData.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3 md:mt-8">
                <button
                  disabled={currentPage <= 0}
                  onClick={() => load(currentPage - 1)}
                  className="rounded border px-3 py-2 text-sm font-medium transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Назад
                </button>
                <span className="text-sm text-gray-500">Стр. {currentPage + 1} / {pageData.totalPages}</span>
                <button
                  disabled={currentPage >= pageData.totalPages - 1}
                  onClick={() => load(currentPage + 1)}
                  className="rounded border px-3 py-2 text-sm font-medium transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Вперед
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default WeeklyProductsPage;
