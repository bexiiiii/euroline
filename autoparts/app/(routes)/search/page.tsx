"use client"

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useSearchStore } from "@/lib/stores/searchStore";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import FiltersSidebar from "@/components/FiltersSidebar";
import PaginationButton from "@/components/PaginationWithPrimaryButton";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type SearchItem } from "@/lib/api/search";
import AnalogsTable from "@/components/AnalogsTable";
import { toast } from "sonner";
import { useCartStore } from "@/lib/stores/cartStore";

function normalizeArticle(article?: string | null): string {
  return (article ?? "").replace(/\s+/g, "").toUpperCase();
}

function computeAvailableQuantity(item?: SearchItem): number {
  if (!item) return 0;
  if (typeof item.quantity === "number" && !Number.isNaN(item.quantity)) {
    return Math.max(item.quantity, 0);
  }
  if (!item.warehouses || item.warehouses.length === 0) {
    return 0;
  }
  return item.warehouses.reduce((sum, warehouse) => sum + (warehouse.qty ?? 0), 0);
}

function ensureAbsoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `https://api.umapi.ru${url}`;
  }
  return url;
}

function SearchPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersVersion, setFiltersVersion] = useState(0);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllAnalogs, setShowAllAnalogs] = useState(false);
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [analogFilter, setAnalogFilter] = useState<string>("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const searchParams = useSearchParams();
  const {
    search,
    results,
    query,
    error,
    filters,
    clearResults,
    resetFilters: resetSearchFilters,
  } = useSearchStore();
  const { addByOem } = useCartStore();

  const { brands, photoOnly } = filters;
  const activeFiltersCount = useMemo(() => {
    let count = brands.length;
    if (photoOnly) count += 1;
    return count;
  }, [brands, photoOnly]);

  useEffect(() => {
    const queryParam = searchParams?.get("q");
    if (queryParam) {
      if (queryParam !== query) {
        search(queryParam);
      }
    } else {
      clearResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setBrandFilter("");
    setAnalogFilter("");
    setShowAllBrands(false);
    setShowAllAnalogs(false);
    setQuantities({});
  }, [query]);

  const primaryResults = useMemo(
    () => results.filter((r: SearchItem) => r.catalog !== "UMAPI_ANALOG"),
    [results]
  );

  const analogResults = useMemo(
    () => results.filter((r: SearchItem) => r.catalog === "UMAPI_ANALOG"),
    [results]
  );

  const primaryResultByArticle = useMemo(() => {
    const map = new Map<string, SearchItem>();
    primaryResults.forEach((item) => {
      const key = normalizeArticle(item.oem);
      if (key.length > 0) {
        map.set(key, item);
      }
    });
    return map;
  }, [primaryResults]);

  const filteredPrimarySearchResults = useMemo(() => {
    return primaryResults.filter((item) => {
      if (filters.brands.length > 0) {
        if (!item.brand) return false;
        if (!filters.brands.includes(item.brand)) return false;
      }
      if (filters.photoOnly && !item.imageUrl) {
        return false;
      }
      return true;
    });
  }, [primaryResults, filters.brands, filters.photoOnly]);

  const filteredBrandItems = useMemo(() => {
    return filteredPrimarySearchResults.filter((item) =>
      brandFilter ? (item.brand || "").toLowerCase().includes(brandFilter.toLowerCase()) : true
    );
  }, [filteredPrimarySearchResults, brandFilter]);
  const displayedBrandItems = showAllBrands ? filteredBrandItems : filteredBrandItems.slice(0, 5);

  const filteredAnalogs = analogResults.filter((analog) =>
    !analogFilter ? true : (analog.brand || "").toLowerCase().includes(analogFilter.toLowerCase())
  );
  const displayedAnalogs = showAllAnalogs ? filteredAnalogs : filteredAnalogs.slice(0, 5);

  const hasAnyResults = filteredPrimarySearchResults.length > 0 || filteredAnalogs.length > 0;

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

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

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
                  <DrawerTitle className="text-base font-semibold text-slate-900">
                    Фильтры поиска
                  </DrawerTitle>
                  <p className="text-sm text-slate-500">
                    Выберите бренды или включите отображение только с фотографиями.
                  </p>
                </DrawerHeader>
                <DrawerBody className="pb-10">
                  <FiltersSidebar key={filtersVersion} isMobile showApplyButton={false} />
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
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-slate-500 hover:text-slate-800"
                    >
                      Закрыть
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <aside className="hidden lg:block lg:w-1/4">
              <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2">
                <FiltersSidebar key={filtersVersion} />
              </div>
            </aside>

            <section className="w-full lg:w-3/4">
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
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">
                            Фото
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Бренд
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Артикул
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Наименование
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Склад
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Остатки
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                            Цена
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">
                            Кол-во
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {displayedBrandItems.length > 0 ? (
                          displayedBrandItems.map((item, idx) => {
                            const normalizedArticle = normalizeArticle(item.oem);
                            const searchMatch = primaryResultByArticle.get(normalizedArticle) ?? item;
                            const stock = computeAvailableQuantity(searchMatch);
                            const priceValue = typeof searchMatch?.price === "number" ? searchMatch.price : null;
                            let warehouseName = "Нет данных";
                            if (searchMatch?.warehouses && searchMatch.warehouses.length > 0) {
                              const visibleWarehouses = searchMatch.warehouses.slice(0, 2);
                              const labels = visibleWarehouses.map((warehouse) => {
                                const name = warehouse.name || warehouse.code || "Склад";
                                const qty = warehouse.qty ?? 0;
                                return `${name} (${qty})`;
                              });
                              warehouseName = labels.join(", ");
                              if (searchMatch.warehouses.length > visibleWarehouses.length) {
                                warehouseName += ` и ещё ${searchMatch.warehouses.length - visibleWarehouses.length}`;
                              }
                            }
                            const formattedPrice =
                              priceValue !== null
                                ? `${new Intl.NumberFormat("ru-RU").format(priceValue)} ${
                                    searchMatch?.currency || "₸"
                                  }`
                                : "Цена по запросу";
                            const defaultQuantity = stock > 0 ? 1 : 0;
                            const itemKey = `brand-${normalizedArticle}-${searchMatch?.brand || item.brand || "UNKNOWN"}-${idx}`;
                            const quantity = quantities[itemKey] ?? defaultQuantity;
                            const hasStock = stock > 0;
                            const productName = searchMatch?.name || item.name || searchMatch?.oem || "Товар";
                            const productBrand = searchMatch?.brand || item.brand || "UNKNOWN";
                            const productArticle = normalizedArticle || searchMatch?.oem || item.oem || productName;
                            const imageUrl = ensureAbsoluteUrl(searchMatch?.imageUrl || item.imageUrl);

                            const handleAddToCart = async () => {
                              if (!hasStock) {
                                toast.error("Товар отсутствует на складах");
                                return;
                              }
                              if (quantity <= 0) {
                                toast.error("Укажите количество");
                                return;
                              }
                              try {
                                await addByOem(
                                  productArticle,
                                  productName,
                                  productBrand,
                                  quantity,
                                  priceValue ?? undefined,
                                  imageUrl
                                );
                                toast.success("Товар добавлен в корзину");
                              } catch (error: any) {
                                console.error("Failed to add brand item to cart", error);
                                toast.error(error?.message || "Не удалось добавить товар в корзину");
                              }
                            };

                            return (
                              <tr key={itemKey} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-center">
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={productName}
                                      className="w-12 h-12 object-cover rounded mx-auto"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-100 rounded mx-auto flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">Нет фото</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{productBrand}</td>
                                <td className="px-4 py-2 text-sm font-mono text-gray-900">{searchMatch?.oem || item.oem}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{productName}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{warehouseName}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                      stock > 5
                                        ? "bg-green-100 text-green-700"
                                        : stock > 0
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {stock > 0 ? `${stock} шт` : "Нет в наличии"}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">{formattedPrice}</td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="number"
                                    min={hasStock ? 1 : 0}
                                    max={stock}
                                    value={quantity}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10) || 1;
                                      setQuantities((prev) => ({
                                        ...prev,
                                        [itemKey]: hasStock ? Math.min(Math.max(1, val), stock) : 0,
                                      }));
                                    }}
                                    disabled={!hasStock}
                                    className="w-14 px-2 py-0.5 text-center text-sm border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400"
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={handleAddToCart}
                                    disabled={!hasStock}
                                    className="inline-flex items-center justify-center w-9 h-9 rounded border border-transparent bg-orange-500 text-white hover:bg-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    aria-label="Добавить в корзину"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                              Запчасти не найдены
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredBrandItems.length > 5 && (
                    <div className="px-6 py-3 bg-gray-50 border-t flex justify-center">
                      <button
                        onClick={() => setShowAllBrands(!showAllBrands)}
                        className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        {showAllBrands ? "Свернуть" : `Показать все (${filteredBrandItems.length})`}
                      </button>
                    </div>
                  )}
                </div>

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
                    Альтернативные запчасти для артикула{" "}
                    <span className="font-mono font-medium">{query}</span>
                  </p>
                </div>
                <AnalogsTable analogs={displayedAnalogs} />
                {filteredAnalogs.length > 5 && (
                  <div className="px-6 py-3 bg-orange-50 border-t flex justify-center">
                    <button
                      onClick={() => setShowAllAnalogs(!showAllAnalogs)}
                      className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                    >
                      {showAllAnalogs ? "Свернуть" : `Показать все (${filteredAnalogs.length})`}
                    </button>
                  </div>
                )}
              </div>

              {hasAnyResults && (
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
