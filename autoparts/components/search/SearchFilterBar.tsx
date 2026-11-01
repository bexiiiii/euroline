"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

// Фильтры — верхняя полоса таблицы выдачи: группы «чипов» в стиле Euroline.

export type SearchFilters = {
  brand: string;      // "" — все бренды
  photo: boolean;
  inStock: boolean;
  minQty: string;     // "" — любое количество
  sort: "stock" | "price";
};

const chip = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${active
    ? "border-orange-500 bg-orange-500 text-white"
    : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:text-orange-600"}`;

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">
    <span className="mr-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
    {children}
  </div>;
}

function BrandMenu({ brands, value, onChange }: { brands: string[]; value: string; onChange: (brand: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return <div ref={ref} className="relative">
    <button type="button" className={chip(!!value)} onClick={() => setOpen(v => !v)} aria-expanded={open}>
      {value || "Бренды"} <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
    </button>
    {open && <div className="absolute left-0 top-full z-30 mt-2 max-h-72 w-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
      {brands.map(brand => <button key={brand} type="button" onClick={() => { onChange(brand); setOpen(false); }}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-orange-50 ${brand === value ? "font-semibold text-orange-600" : "text-slate-700"}`}>
        {brand}{brand === value && <Check size={14} />}
      </button>)}
      {!brands.length && <p className="px-3 py-2 text-sm text-slate-500">Нет брендов</p>}
    </div>}
  </div>;
}

export default function SearchFilterBar({ filters, brands, onChange }: {
  filters: SearchFilters;
  brands: string[];
  onChange: (patch: Partial<SearchFilters>) => void;
}) {
  return <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
    <Group label="Аналоги">
      <button type="button" className={chip(!filters.brand && !filters.photo)} onClick={() => onChange({ brand: "", photo: false })}>Все</button>
      <BrandMenu brands={brands} value={filters.brand} onChange={brand => onChange({ brand })} />
      <button type="button" className={chip(filters.photo)} onClick={() => onChange({ photo: !filters.photo })}>С фото</button>
    </Group>

    <Group label="Наличие">
      <button type="button" className={chip(!filters.inStock && !filters.minQty)} onClick={() => onChange({ inStock: false, minQty: "" })}>Любое</button>
      <button type="button" className={chip(filters.inStock && !filters.minQty)} onClick={() => onChange({ inStock: true, minQty: "" })}>В наличии</button>
      <label className={chip(!!filters.minQty)}>
        от
        <input type="number" min={1} inputMode="numeric" aria-label="Минимальный остаток, шт" value={filters.minQty} placeholder="—"
          onChange={e => onChange({ minQty: e.target.value.replace(/\D/g, ""), inStock: !!e.target.value })}
          className="w-9 bg-transparent text-center focus:outline-none placeholder:text-current [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        шт
      </label>
    </Group>

    <Group label="Сортировка">
      <button type="button" className={chip(filters.sort === "stock")} onClick={() => onChange({ sort: "stock" })}>По наличию</button>
      <button type="button" className={chip(filters.sort === "price")} onClick={() => onChange({ sort: "price" })}>Сначала дешевле</button>
    </Group>
  </div>;
}
