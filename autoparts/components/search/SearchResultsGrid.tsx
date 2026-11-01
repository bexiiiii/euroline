"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import ProductPhoto from "@/components/ProductPhoto";
import { useCartStore } from "@/lib/stores/cartStore";
import type { SearchItem, SearchWarehouse } from "@/lib/api/search";
import { partIdentity } from "@/lib/searchResults";
import { resolveProductImageUrl } from "@/lib/utils";

// Единая таблица выдачи: разделы «Запрашиваемый артикул» и «Аналоги»,
// у каждой детали — строка на склад, первые 3 склада видны сразу, остальные по «Показать ещё».

const VISIBLE_WAREHOUSES = 3;
const COLUMNS = 8;

const partUrl = (item: SearchItem) => `/search?${new URLSearchParams({ q: item.oem, brand: item.brand })}`;
const money = (value: number, currency?: string | null) =>
  `${new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency && currency !== "KZT" ? currency : "₸"}`;

type OfferRow = { warehouse: SearchWarehouse | null; stock: number | null };

function offerRows(item: SearchItem): OfferRow[] {
  const warehouses = [...(item.warehouses ?? [])].sort((a, b) => (b.qty ?? -1) - (a.qty ?? -1));
  if (!warehouses.length) return [{ warehouse: null, stock: null }];
  return warehouses.map(warehouse => ({
    warehouse,
    stock: typeof warehouse.qty === "number" ? Math.max(0, warehouse.qty) : null,
  }));
}

function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null) return <span className="text-xs text-slate-400">—</span>;
  if (stock <= 0) return <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Нет</span>;
  return <span className="whitespace-nowrap rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">{new Intl.NumberFormat("ru-RU").format(stock)} шт</span>;
}

function OrderCell({ item, row }: { item: SearchItem; row: OfferRow }) {
  const { addOffer } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const refKey = row.warehouse?.refKey;
  // Цена 0 / не пришла — заказать можно, менеджер уточнит цену.
  const canOrder = !!item.productId && !!refKey && row.stock !== null && row.stock > 0;

  // Нет остатка на складе — заказать нечего, ячейку оставляем пустой
  if (!canOrder) return null;
  const max = row.stock ?? 1;
  const add = async () => {
    setPending(true);
    try {
      await addOffer(item.productId!, refKey!, quantity, { brand: item.brand, image: item.imageUrl || item.umapiImages?.[0] });
      toast.success("Товар добавлен в корзину");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось добавить товар");
    } finally {
      setPending(false);
    }
  };
  return <div className="flex items-center justify-end gap-2">
    <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white">
      <button type="button" aria-label="Меньше" className="px-2 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-orange-600 disabled:opacity-40"
        disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={14} /></button>
      <input aria-label={`Количество ${item.brand} ${item.oem}`} type="number" min={1} max={max}
        className="w-10 py-1.5 text-center text-sm focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        value={quantity} onChange={e => setQuantity(Math.min(max, Math.max(1, Number(e.target.value) || 1)))} />
      <button type="button" aria-label="Больше" className="px-2 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-orange-600 disabled:opacity-40"
        disabled={quantity >= max} onClick={() => setQuantity(q => Math.min(max, q + 1))}><Plus size={14} /></button>
    </div>
    <button type="button" onClick={add} disabled={pending}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
      <ShoppingCart size={16} />{pending ? "…" : "В корзину"}
    </button>
  </div>;
}

function PartRows({ item, requested }: { item: SearchItem; requested: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const rows = offerRows(item);
  const shown = expanded ? rows : rows.slice(0, VISIBLE_WAREHOUSES);
  const hidden = rows.length - shown.length;
  const hasPrice = typeof item.price === "number" && item.price > 0;
  const span = shown.length;
  const muted = rows.every(row => !row.stock);

  return <>
    {shown.map((row, index) => <tr key={(row.warehouse?.refKey ?? row.warehouse?.code ?? "none") + index}
      className={`align-middle transition-colors hover:bg-orange-50/40 ${index === shown.length - 1 ? "border-b border-slate-200" : "border-b border-slate-100"} ${muted ? "text-slate-400" : "text-slate-800"}`}>
      {index === 0 && <>
        <td rowSpan={span} className="px-4 py-3 align-top"><ProductPhoto src={resolveProductImageUrl(item.imageUrl)} alt={item.name} /></td>
        <td rowSpan={span} className="px-4 py-3 align-top font-semibold">
          {requested ? item.brand : <Link href={partUrl(item)} className="text-slate-900 hover:text-orange-600">{item.brand}</Link>}
        </td>
        <td rowSpan={span} className="px-4 py-3 align-top font-mono text-sm">{item.oem}</td>
        <td rowSpan={span} className="border-r border-slate-100 px-4 py-3 align-top">
          <div className="flex h-full flex-col items-start gap-2">
            <span className="text-sm leading-5 text-slate-600">{item.name}</span>
            {item.catalogName && <span className="text-xs leading-4 text-slate-400">«{item.catalogName}»</span>}
            {rows.length > VISIBLE_WAREHOUSES && <button type="button" onClick={() => setExpanded(v => !v)}
              className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100">
              {expanded ? "Скрыть склады" : `Ещё склады: ${hidden}`}
            </button>}
          </div>
        </td>
      </>}
      <td className="px-4 py-2.5 text-center"><StockBadge stock={row.stock} /></td>
      <td className="px-4 py-2.5 text-sm text-slate-700">{row.warehouse ? (row.warehouse.name || row.warehouse.code) : <span className="text-slate-400">Склад не указан</span>}</td>
      <td className="whitespace-nowrap px-4 py-2.5 text-right">{hasPrice ? <span className="font-semibold text-slate-900">{money(item.price!, item.currency)}</span> : <span className="text-sm text-slate-500">Цена по запросу</span>}</td>
      <td className="px-4 py-2"><OrderCell item={item} row={row} /></td>
    </tr>)}
  </>;
}

function SectionRow({ title, tone, count }: { title: string; tone: "requested" | "analogs"; count?: number }) {
  return <tr className={tone === "requested" ? "bg-orange-50" : "bg-slate-50"}>
    <td colSpan={COLUMNS} className={`border-l-4 px-4 py-2.5 text-sm font-semibold ${tone === "requested" ? "border-orange-500 text-orange-800" : "border-slate-400 text-slate-700"}`}>
      {title}{typeof count === "number" && <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{count}</span>}
    </td>
  </tr>;
}

export default function SearchResultsGrid({ requested, analogs, analogsLoading, emptyAnalogsText, toolbar, total }: {
  requested: SearchItem[];
  analogs: SearchItem[];
  analogsLoading?: boolean;
  emptyAnalogsText?: string;
  /** Фильтры — встроены в шапку таблицы */
  toolbar?: React.ReactNode;
  /** Всего аналогов (analogs — только текущая страница) */
  total?: number;
}) {
  // analogs уже отсортированы: в наличии, затем остальные (sortAnalogs) — одной секцией
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    {toolbar}
    <div className="overflow-x-auto">
    <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
      <thead className="border-b border-slate-200 bg-white text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="w-20 px-4 py-3 font-medium">Фото</th>
          <th className="px-4 py-3 font-medium">Бренд</th>
          <th className="px-4 py-3 font-medium">Артикул</th>
          <th className="px-4 py-3 font-medium">Наименование</th>
          <th className="px-4 py-3 text-center font-medium">Наличие</th>
          <th className="px-4 py-3 font-medium">Склад</th>
          <th className="px-4 py-3 text-right font-medium">Цена</th>
          <th className="w-52 px-4 py-3 text-right font-medium">Заказ</th>
        </tr>
      </thead>
      <tbody>
        {!!requested.length && <>
          <SectionRow title="Запрашиваемый артикул" tone="requested" />
          {requested.map(item => <PartRows key={partIdentity(item)} item={item} requested />)}
        </>}
        {analogs.length ? <>
          <SectionRow title={analogsLoading ? "Аналоги · подбираем ещё…" : "Аналоги"} tone="analogs" count={total ?? analogs.length} />
          {analogs.map(item => <Fragment key={partIdentity(item)}><PartRows item={item} requested={false} /></Fragment>)}
        </> : <>
          <SectionRow title={analogsLoading ? "Возможные замены · подбираем…" : "Возможные замены"} tone="analogs" />
          <tr><td colSpan={COLUMNS} className="px-4 py-8 text-center text-sm text-slate-500">{emptyAnalogsText ?? "Аналоги не найдены."}</td></tr>
        </>}
      </tbody>
    </table>
    </div>
  </div>;
}
