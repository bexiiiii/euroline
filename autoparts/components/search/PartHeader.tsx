"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductPhoto from "@/components/ProductPhoto";
import type { SearchItem } from "@/lib/api/search";
import { resolveProductImageUrl } from "@/lib/utils";

// Карточка искомой детали над таблицей: фото, «БРЕНД АРТИКУЛ», название
// и «Дополнительная информация» — OE-номера, характеристики, EAN, если они есть.

export default function PartHeader({ item, brand, article, backHref }: {
  item: SearchItem;
  brand: string;
  article: string;
  backHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const photo = resolveProductImageUrl(item.imageUrl || item.umapiImages?.[0]);
  const oe = item.oeNumbers ?? [];
  const criteria = item.criteria ?? [];
  const ean = item.eanNumbers ?? [];
  const hasDetails = oe.length > 0 || criteria.length > 0 || ean.length > 0;

  return <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-slate-50 [&_img]:h-20 [&_img]:w-28 [&_img]:object-contain [&>div]:h-20 [&>div]:w-28">
        <ProductPhoto src={photo} alt={item.name} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Искомая деталь</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{brand} <span className="font-mono">{article}</span></h2>
        <p className="mt-1 text-slate-600">{item.name}</p>
        {item.catalogName && <p className="mt-0.5 text-sm text-slate-400">«{item.catalogName}»</p>}
        {hasDetails && <button type="button" onClick={() => setOpen(v => !v)}
          className="mt-3 text-sm font-medium text-orange-600 hover:underline">
          {open ? "Скрыть информацию" : "Дополнительная информация"}
        </button>}
      </div>
      {backHref && <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-orange-600 hover:underline">
        <ArrowLeft size={16} />Выбрать другую деталь
      </Link>}
    </div>
    {open && <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 text-sm md:grid-cols-2">
      {criteria.length > 0 && <div>
        <h3 className="mb-2 font-semibold text-slate-800">Характеристики</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {criteria.map(c => <div key={`${c.id}-${c.name}`} className="contents">
            <dt className="text-slate-500">{c.name}</dt>
            <dd className="text-slate-800">{c.value}{c.unit ? ` ${c.unit}` : ""}</dd>
          </div>)}
        </dl>
      </div>}
      {(oe.length > 0 || ean.length > 0) && <div className="space-y-3">
        {oe.length > 0 && <div>
          <h3 className="mb-2 font-semibold text-slate-800">OE-номера</h3>
          <p className="font-mono text-xs leading-6 text-slate-700">{oe.join(", ")}</p>
        </div>}
        {ean.length > 0 && <div>
          <h3 className="mb-2 font-semibold text-slate-800">EAN</h3>
          <p className="font-mono text-xs text-slate-700">{ean.join(", ")}</p>
        </div>}
      </div>}
    </div>}
  </section>;
}
