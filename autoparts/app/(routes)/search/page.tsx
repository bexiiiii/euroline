"use client";

import { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import ProductPhoto from "@/components/ProductPhoto";
import PaginationButton from "@/components/PaginationWithPrimaryButton";
import { searchKey, useSearchStore } from "@/lib/stores/searchStore";
import GuestSearchLimitModal from "@/components/GuestSearchLimitModal";
import SearchResultsGrid from "@/components/search/SearchResultsGrid";
import PartHeader from "@/components/search/PartHeader";
import SearchFilterBar, { type SearchFilters } from "@/components/search/SearchFilterBar";
import { SearchItem } from "@/lib/api/search";
import { availableQuantity, partIdentity, sortAnalogs, sortParts } from "@/lib/searchResults";
import { resolveProductImageUrl } from "@/lib/utils";

const PAGE_SIZE = 20;
const partUrl = (item: SearchItem) => `/search?${new URLSearchParams({ q: item.oem, brand: item.brand })}`;
const quantityLabel = (quantity: number | null) => quantity === null ? "Остаток не получен" : quantity > 0 ? `${quantity} шт` : "Нет в наличии";

function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const brand = params.get("brand") || undefined;
  const { search, clearResults, results, error, isLoading, lastSearchKey, selectionRequired,
    selectedArticle, selectedBrand, warnings, detectedType, vehicle, analogsLoading, refreshAnalogs } = useSearchStore();
  const requestKey = searchKey(q, undefined, brand);
  const loading = isLoading || (!!q && requestKey !== lastSearchKey);
  const filters: SearchFilters = {
    brand: params.get("analogBrand") ?? "",
    photo: params.get("photo") === "1",
    inStock: params.get("stock") === "1",
    minQty: params.get("minQty") ?? "",
    sort: params.get("sort") === "price" ? "price" : "stock",
  };
  const { sort } = filters;

  useEffect(() => {
    if (!q.trim()) { clearResults(); return; }
    if (useSearchStore.getState().lastSearchKey !== requestKey) void search(q, undefined, brand);
  }, [q, brand, requestKey, search, clearResults]);

  useEffect(() => {
    if (!analogsLoading || loading) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const poll = async () => {
      if (cancelled) return;
      const pending = await refreshAnalogs(q, brand);
      if (cancelled || !pending) return;
      if (++attempts >= 60) {
        const state = useSearchStore.getState();
        if (state.lastSearchKey === requestKey) useSearchStore.setState({ analogsLoading: false,
          warnings: [...state.warnings, 'Подбор OE продолжается на сервере. Повторите поиск немного позже.'] });
        return;
      }
      timer = setTimeout(poll, 2500);
    };
    timer = setTimeout(poll, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, brand, requestKey, analogsLoading, loading, refreshAnalogs]);

  // Предупреждения поиска — toast-уведомлением, а не плашкой; каждое один раз на запрос
  const shownWarnings = useRef(new Set<string>());
  useEffect(() => {
    for (const message of warnings) {
      const key = `${requestKey}::${message}`;
      if (shownWarnings.current.has(key)) continue;
      shownWarnings.current.add(key);
      toast.warning(message);
    }
  }, [warnings, requestKey]);

  const setFilters = (patch: Partial<SearchFilters>) => {
    const merged = { ...filters, ...patch };
    const next = new URLSearchParams(params.toString());
    const put = (name: string, value: string) => { if (value) next.set(name, value); else next.delete(name); };
    put("analogBrand", merged.brand);
    put("photo", merged.photo ? "1" : "");
    put("stock", merged.inStock ? "1" : "");
    put("minQty", merged.minQty);
    put("sort", merged.sort === "price" ? "price" : "");
    next.delete("page");
    router.replace(`/search?${next}`, { scroll: false });
  };
  const minQty = Number(filters.minQty) || 0;
  const passesStock = (item: SearchItem) => {
    const qty = availableQuantity(item) ?? 0;
    return (!filters.inStock || qty > 0) && qty >= minQty;
  };
  const primary = sortParts(results.filter(item => item.catalog !== "UMAPI_ANALOG"), sort);
  const allAnalogs = results.filter(item => item.catalog === "UMAPI_ANALOG");
  const analogs = sortAnalogs(allAnalogs
    .filter(item => !filters.brand || item.brand === filters.brand)
    .filter(item => !filters.photo || !!item.imageUrl)
    .filter(passesStock), sort);
  const analogBrands = [...new Set(allAnalogs.map(item => item.brand))].sort();
  const filtersActive = !!(filters.brand || filters.photo || filters.inStock || filters.minQty);
  // Карточка сверху — именно выбранная деталь (бренд из запроса), а не первая строка списка
  const headerItem = (selectedBrand && primary.find(item => item.brand.toUpperCase() === selectedBrand.toUpperCase())) || primary[0];
  const paged = selectionRequired ? primary : analogs;
  const totalPages = Math.max(1, Math.ceil(paged.length / PAGE_SIZE));
  const requestedPage = Number(params.get("page") ?? "1");
  const page = Number.isFinite(requestedPage) ? Math.max(0, Math.min(totalPages - 1, Math.floor(requestedPage) - 1)) : 0;
  const visible = paged.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return <div className="min-h-screen bg-white pt-24">
    <main id="main-content" className="mx-auto max-w-screen-2xl px-4 py-6 md:px-8">
      <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Поиск запчастей</h1>
      <p className="mb-6 text-center text-sm text-slate-500">Артикул или бренд и артикул — затем выберите нужную деталь.</p>
      <ActionSearchBar />
      <div className="mt-8">
        {loading ? <div role="status" className="rounded-xl border bg-slate-50 p-12 text-center text-slate-500">Ищем детали и предложения…</div>
        : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p>{error}</p><button className="mt-3 text-orange-700 underline" onClick={() => search(q, undefined, brand)}>Повторить поиск</button>
        </div> : <>
          {detectedType === "VIN" && <div className="rounded-xl border p-6">{vehicle
            ? <Link href={`/catalogs/${vehicle.vehicleId}?${new URLSearchParams({ ssd: vehicle.ssd, catalog: vehicle.catalog, brand: vehicle.brand, name: vehicle.name })}`} className="text-orange-600">Открыть каталог {vehicle.brand} {vehicle.name}</Link>
            : <p>Автомобиль с VIN {q} не найден. Проверьте номер или выберите автомобиль в каталоге.</p>}</div>}
          {selectionRequired ? <section className="overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b bg-slate-50 p-5"><h2 className="text-xl font-semibold">Уточните деталь ({primary.length})</h2>
              <p className="mt-2 text-sm text-slate-600">Номер {q} встречается у разных производителей. Выберите бренд — покажем только его предложения и возможные замены.</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500"><tr>{["Фото", "Бренд", "Артикул", "Наименование", "Наличие", ""].map((label, i) => <th key={i} className="px-4 py-3">{label}</th>)}</tr></thead>
              <tbody className="divide-y">{visible.map(item => <tr key={partIdentity(item)} className="hover:bg-slate-50">
                <td className="px-4 py-3"><ProductPhoto src={resolveProductImageUrl(item.imageUrl)} alt={item.name} /></td>
                <td className="px-4 py-3 font-semibold">{item.brand}</td><td className="px-4 py-3 font-mono">{item.oem}</td>
                <td className="px-4 py-3">{item.name}{item.catalogName && <span className="block text-xs text-slate-400">«{item.catalogName}»</span>}</td><td className="px-4 py-3">{quantityLabel(availableQuantity(item))}</td>
                <td className="px-4 py-3"><Link href={partUrl(item)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-orange-500 px-3 py-2 text-white hover:bg-orange-600">Цены и аналоги <ArrowRight size={16} /></Link></td>
              </tr>)}</tbody>
            </table></div>
          </section> : !!results.length && <>
            {headerItem && <PartHeader item={headerItem} brand={selectedBrand || headerItem.brand} article={selectedArticle || headerItem.oem}
              backHref={selectedBrand ? `/search?q=${encodeURIComponent(selectedArticle || q)}` : undefined} />}
            <SearchResultsGrid requested={primary} analogs={visible} analogsLoading={analogsLoading}
              total={analogs.length}
              toolbar={<SearchFilterBar filters={filters} brands={analogBrands} onChange={setFilters} />}
              emptyAnalogsText={filtersActive ? "Нет аналогов с выбранными фильтрами." : "Аналоги не найдены. Можно уточнить подбор у менеджера."} />
          </>}
          {!results.length && detectedType !== "VIN" && <p className="py-12 text-center text-slate-500">{q ? "Ничего не найдено. Проверьте артикул или попробуйте поиск по названию." : "Введите артикул для поиска."}</p>}
          {totalPages > 1 && <div className="mt-6"><PaginationButton page={page} totalPages={totalPages} onPageChange={nextPage => {
            const next = new URLSearchParams(params.toString()); next.set("page", String(nextPage + 1));
            router.push(`/search?${next}`, { scroll: false });
          }} /></div>}
        </>}
      </div>
    </main>
  </div>;
}

export default function SearchPageWrapper() {
  return <Suspense fallback={<div className="py-16 text-center text-slate-500">Загрузка…</div>}>
    <SearchPage />
    <GuestSearchLimitModal />
  </Suspense>;
}
