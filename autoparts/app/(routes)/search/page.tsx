"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import ProductPhoto from "@/components/ProductPhoto";
import PaginationButton from "@/components/PaginationWithPrimaryButton";
import { searchKey, useSearchStore } from "@/lib/stores/searchStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { SearchItem } from "@/lib/api/search";
import { availableQuantity, partIdentity, sortParts, segmentAnalogs } from "@/lib/searchResults";
import { resolveProductImageUrl } from "@/lib/utils";

const PAGE_SIZE = 20;
const fieldClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";
const partUrl = (item: SearchItem) => `/search?${new URLSearchParams({ q: item.oem, brand: item.brand })}`;
const quantityLabel = (quantity: number | null) => quantity === null ? "Остаток не получен" : quantity > 0 ? `${quantity} шт` : "Нет в наличии";

function Offers({ item }: { item: SearchItem }) {
  const { addOffer } = useCartStore();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);
  const warehouses = [...(item.warehouses ?? [])].sort((a, b) => (b.qty ?? -1) - (a.qty ?? -1));
  const hasPrice = typeof item.price === "number" && item.price > 0;
  const rows = warehouses.length ? warehouses : [{ code: "", name: "Склад не указан", address: "", qty: null, refKey: undefined }];

  return <div className="overflow-x-auto">
    <table className="w-full min-w-[650px] text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
        <tr>{["Склад", "Доступно", "Цена", "Количество", "Действие"].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((warehouse, index) => {
          const key = warehouse.refKey ?? warehouse.code ?? String(index);
          const stock = typeof warehouse.qty === "number" ? Math.max(0, warehouse.qty) : null;
          const canOrder = !!item.productId && !!warehouse.refKey && stock !== null && stock > 0 && hasPrice;
          const quantity = Number(quantities[key] ?? "1");
          const validQuantity = Number.isInteger(quantity) && quantity > 0 && stock !== null && quantity <= stock;
          const add = async () => {
            if (!canOrder || !validQuantity || !item.productId || !warehouse.refKey) return;
            setPending(key);
            try {
              await addOffer(item.productId, warehouse.refKey, quantity);
              toast.success("Товар добавлен в корзину");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Не удалось добавить товар");
            } finally { setPending(null); }
          };
          return <tr key={key + index}>
            <td className="px-4 py-3 text-slate-700">{warehouse.name || warehouse.code || "Склад не указан"}</td>
            <td className="px-4 py-3"><span className={stock && stock > 0 ? "rounded bg-green-50 px-2 py-1 text-green-700" : "text-slate-500"}>{quantityLabel(stock)}</span></td>
            <td className="px-4 py-3 whitespace-nowrap">{hasPrice ? `${new Intl.NumberFormat("ru-RU").format(item.price!)} ${item.currency || "₸"}` : "Цена по запросу"}</td>
            <td className="px-4 py-3"><input aria-label={`Количество ${item.brand} ${item.oem}, ${warehouse.name}`}
              className="w-20 rounded border border-slate-300 px-2 py-1.5 disabled:bg-slate-50" type="number"
              min={1} max={stock ?? undefined} step={1} disabled={!canOrder || pending !== null}
              value={quantities[key] ?? "1"} onChange={e => setQuantities(old => ({ ...old, [key]: e.target.value }))} /></td>
            <td className="px-4 py-3">{canOrder
              ? <button type="button" onClick={add} disabled={!validQuantity || pending !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-white hover:bg-orange-600 disabled:opacity-50">
                  <ShoppingCart size={16} />{pending === key ? "Добавляем…" : "В корзину"}
                </button>
              : <Link href="/contacts" className="font-medium text-orange-600 hover:underline">{!hasPrice ? "Уточнить цену" : "Уточнить наличие"}</Link>}
            </td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}

function PartCard({ item, primary = false }: { item: SearchItem; primary?: boolean }) {
  const stock = availableQuantity(item);
  return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex items-start gap-4 px-4 py-4">
      <ProductPhoto src={resolveProductImageUrl(item.imageUrl)} alt={item.name} />
      <div className="min-w-0 flex-1">
        {primary ? <h3 className="font-semibold text-slate-900">{item.brand} <span className="font-mono">{item.oem}</span></h3>
          : <Link href={partUrl(item)} className="font-semibold text-slate-900 hover:text-orange-600">{item.brand} <span className="font-mono">{item.oem}</span></Link>}
        <p className="mt-1 text-sm text-slate-600">{item.name}</p>
        {!primary && <p className="mt-1 text-xs text-slate-500">{item.analogSource === "UMAPI_SHARED_OE"
          ? `Замена по общему OE: ${(item.oeNumbers ?? []).slice(0, 3).join(", ")}`
          : `Кросс каталога ${item.analogSource || "поставщика"}`} · применяемость требует проверки</p>}
        {!primary && <p className={`mt-1 text-xs ${item.vehicleSegment === "TRUCK_TRAILER" ? "text-green-700" : "text-amber-700"}`}>
          {item.vehicleSegment === "TRUCK_TRAILER" ? "Грузовики / прицепы — по данным каталога" : item.vehicleSegment === "PENDING" ? "Проверяем тип транспорта…" : "Тип транспорта не подтверждён"}
          {item.vehicleSegmentReason && <span className="block text-slate-500">{item.vehicleSegmentReason}</span>}
        </p>}
      </div>
      <span className={stock && stock > 0 ? "text-sm font-medium text-green-700" : "text-sm text-slate-500"}>{quantityLabel(stock)}</span>
    </div>
    {primary ? <Offers item={item} /> : <details className="border-t border-slate-100">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50">Склады и цены ({item.warehouses?.length || 0})</summary>
      <Offers item={item} />
    </details>}
  </article>;
}

function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const brand = params.get("brand") || undefined;
  const { search, clearResults, results, error, isLoading, lastSearchKey, selectionRequired,
    selectedArticle, selectedBrand, warnings, detectedType, vehicle, analogsLoading, refreshAnalogs } = useSearchStore();
  const requestKey = searchKey(q, undefined, brand);
  const loading = isLoading || (!!q && requestKey !== lastSearchKey);
  const analogBrand = params.get("analogBrand") ?? "";
  const sort = params.get("sort") === "price" ? "price" : "stock";
  const photoOnly = params.get("photo") === "1";
  const unconfirmed = params.get("segment") === "unconfirmed";

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
          warnings: [...state.warnings, 'Подбор замен и проверка применяемости продолжаются на сервере. Повторите поиск немного позже.'] });
        return;
      }
      timer = setTimeout(poll, 2500);
    };
    timer = setTimeout(poll, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, brand, requestKey, analogsLoading, loading, refreshAnalogs]);

  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value); else next.delete(name);
    next.delete("page");
    router.replace(`/search?${next}`, { scroll: false });
  };
  const primary = sortParts(results.filter(item => item.catalog !== "UMAPI_ANALOG"), sort);
  const inSegment = segmentAnalogs(results, unconfirmed);
  const confirmedCount = segmentAnalogs(results).length;
  const unconfirmedCount = segmentAnalogs(results, true).length;
  const analogs = sortParts(inSegment
    .filter(item => !analogBrand || item.brand === analogBrand)
    .filter(item => !photoOnly || !!item.imageUrl), sort);
  const analogBrands = [...new Set([...inSegment.map(item => item.brand), ...(analogBrand ? [analogBrand] : [])])].sort();
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
          {warnings.map(message => <p role="status" key={message} className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</p>)}
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
                <td className="px-4 py-3">{item.name}</td><td className="px-4 py-3">{quantityLabel(availableQuantity(item))}</td>
                <td className="px-4 py-3"><Link href={partUrl(item)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-orange-500 px-3 py-2 text-white hover:bg-orange-600">Цены и аналоги <ArrowRight size={16} /></Link></td>
              </tr>)}</tbody>
            </table></div>
          </section> : <>
            {selectedBrand && <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{selectedBrand} <span className="font-mono">{selectedArticle}</span></h2>
              <Link href={`/search?q=${encodeURIComponent(selectedArticle || q)}`} className="inline-flex items-center gap-2 text-sm text-orange-600"><ArrowLeft size={16} />Выбрать другую деталь</Link>
            </div>}
            {!!primary.length && <section aria-label="Этот товар" className="space-y-3">
              <h2 className="text-lg font-semibold">{selectedBrand ? "Этот товар" : "Найденные товары"}</h2>
              {primary.map(item => <PartCard key={partIdentity(item)} item={item} primary />)}
            </section>}
            {selectedBrand && <section className="mt-8">
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                <h2 className="text-lg font-semibold">{unconfirmed ? "Неподтверждённые замены" : "Грузовики и прицепы"} ({analogs.length})</h2>
                <div className="mt-3 flex flex-wrap gap-2" aria-label="Тип транспорта аналогов">
                  <button type="button" aria-pressed={!unconfirmed} onClick={() => setFilter("segment", "")}
                    className={`rounded-lg border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 ${!unconfirmed ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300 bg-white text-slate-700"}`}>Грузовики и прицепы ({confirmedCount})</button>
                  <button type="button" aria-pressed={unconfirmed} onClick={() => setFilter("segment", "unconfirmed")}
                    className={`rounded-lg border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 ${unconfirmed ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300 bg-white text-slate-700"}`}>Неподтверждённые ({unconfirmedCount})</button>
                </div>
                {analogsLoading && <p role="status" className="mt-2 text-sm text-orange-700">Автоматически подбираем замены и проверяем тип транспорта…</p>}
                <p className="mt-2 text-sm text-slate-600">Для {selectedBrand} {selectedArticle}. {unconfirmed
                  ? "У этих деталей не хватает данных о типе транспорта. Они могут не подходить для грузовика — проверьте применяемость перед заказом."
                  : "Показаны детали с подтверждённой в каталоге грузовой или прицепной применяемостью. Совместимость с вашей моделью и комплектацией проверяйте перед заказом."}</p>
                <div className="mt-4 flex flex-wrap items-end gap-4">
                  <label className="grid gap-1 text-xs text-slate-600">Бренд замены<select className={fieldClass} value={analogBrand} onChange={e => setFilter("analogBrand", e.target.value)}>
                    <option value="">Все бренды</option>{analogBrands.map(value => <option key={value}>{value}</option>)}
                  </select></label>
                  <label className="grid gap-1 text-xs text-slate-600">Порядок<select className={fieldClass} value={sort} onChange={e => setFilter("sort", e.target.value)}>
                    <option value="stock">Сначала больше в наличии</option><option value="price">Сначала дешевле</option>
                  </select></label>
                  <label className="flex items-center gap-2 py-2 text-sm"><input type="checkbox" checked={photoOnly} onChange={e => setFilter("photo", e.target.checked ? "1" : "")} />С фотографиями</label>
                </div>
              </div>
              <div className="mt-4 space-y-3">{visible.map(item => <PartCard key={partIdentity(item)} item={item} />)}</div>
              {!analogs.length && <p role="status" className="py-8 text-center text-slate-500">{analogBrand || photoOnly ? "Нет замен с выбранными фильтрами. Можно сменить бренд или открыть неподтверждённые." : analogsLoading ? "Проверка ещё идёт. Подтверждённые детали появятся автоматически." : unconfirmed ? "Неподтверждённых замен нет." : "Подтверждённые грузовые и прицепные замены не найдены. Посмотрите неподтверждённые — там позиции без достаточных данных каталога."}</p>}
            </section>}
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
  return <Suspense fallback={<div className="py-16 text-center text-slate-500">Загрузка…</div>}><SearchPage /></Suspense>;
}
