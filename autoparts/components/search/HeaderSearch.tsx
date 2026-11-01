"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Clock, Info, Search, X } from "lucide-react";
import { useSearchStore } from "@/lib/stores/searchStore";
import {
  clearSearchHistory,
  readSearchHistory,
  removeSearchHistory,
  subscribeSearchHistory,
  type LocalSearchHistoryItem,
} from "@/lib/searchHistoryLocal";

// Компактная строка поиска в шапке внутренних страниц: белое поле в оранжевой рамке, «Пример», подсказка «i»
// и история поиска выпадающим списком при фокусе (история общая — lib/searchHistoryLocal).

const EXAMPLE_QUERY = "4410329212";
const HISTORY_LIMIT = 8;

export default function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { search, isLoading } = useSearchStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const [history, setHistory] = useState<LocalSearchHistoryItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // На странице результатов в поле — текущий запрос
  const urlQuery = pathname === "/search" ? params.get("q") ?? "" : "";
  useEffect(() => { if (urlQuery) setQuery(urlQuery); }, [urlQuery]);

  useEffect(() => {
    const sync = () => setHistory(readSearchHistory());
    sync();
    return subscribeSearchHistory(sync);
  }, []);

  useEffect(() => {
    if (!open && !hint) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) { setOpen(false); setHint(false); }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, hint]);

  const performSearch = async (value: string) => {
    const normalized = value.trim();
    if (normalized.length < 3) return;
    setQuery(normalized);
    setOpen(false);
    inputRef.current?.blur();
    const result = await search(normalized);
    // VIN: каталог автомобиля в новой вкладке, как в поиске на главной
    if (result?.detectedType === "VIN" && result.vehicle?.vehicleId && result.vehicle.ssd) {
      const v = result.vehicle;
      window.open(`/catalogs/${v.vehicleId}?${new URLSearchParams({ vin: normalized, ssd: v.ssd,
        catalog: v.catalog || "", brand: v.brand || "", name: v.name || "" })}`, "_blank");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  };

  const needle = query.trim().toLowerCase();
  const items = (needle && needle !== urlQuery.toLowerCase()
    ? history.filter(item => item.query.toLowerCase().includes(needle))
    : history).slice(0, HISTORY_LIMIT);

  return (
    <div ref={rootRef} className="relative w-full">
      <form
        role="search"
        onSubmit={e => { e.preventDefault(); void performSearch(query); }}
        className="flex h-10 overflow-hidden rounded-lg border-2 border-orange-500 bg-white"
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setHint(false); }}
          onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
          placeholder="Искать по названию, артикулу или VIN"
          aria-label="Поиск запчастей"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent pl-3 pr-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="px-1.5 text-slate-400 hover:text-slate-600" aria-label="Очистить поле">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={() => { setQuery(EXAMPLE_QUERY); inputRef.current?.focus(); }}
            className="hidden px-2 text-sm text-slate-500 hover:text-orange-600 sm:max-xl:block min-[1440px]:block">
            Пример
          </button>
        )}
        <button type="button" onClick={() => { setHint(v => !v); setOpen(false); }}
          className="hidden pl-0.5 pr-2.5 text-slate-400 hover:text-slate-600 sm:max-xl:block min-[1440px]:block" aria-label="Что можно искать" aria-expanded={hint}>
          <Info className="h-5 w-5 fill-slate-400 text-white" />
        </button>
        <button type="submit" disabled={isLoading || query.trim().length < 3}
          className="flex w-11 shrink-0 items-center justify-center bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed"
          aria-label="Найти">
          {isLoading
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : <Search className="h-5 w-5" />}
        </button>
      </form>

      {hint && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-lg">
          <p className="mb-2 font-semibold text-slate-900">Что можно искать</p>
          <ul className="space-y-1">
            <li><b>Артикул</b> — например, {EXAMPLE_QUERY}</li>
            <li><b>Название</b> — «фильтр масляный»</li>
            <li><b>VIN</b> — 17 символов, откроется каталог автомобиля</li>
          </ul>
        </div>
      )}

      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-sm:fixed max-sm:inset-x-4 max-sm:top-[72px] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2 text-sm text-slate-500">
            <span>История поиска</span>
            <button type="button" onClick={() => clearSearchHistory()} className="hover:text-orange-600">
              Очистить
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.map(item => (
              <li key={item.id} className="group flex items-center hover:bg-slate-50">
                <button type="button" onClick={() => void performSearch(item.query)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left">
                  <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{item.query}</span>
                </button>
                <button type="button" onClick={() => removeSearchHistory(item.id)}
                  className="mr-2 rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 md:opacity-0 md:group-hover:opacity-100"
                  aria-label={`Удалить «${item.query}» из истории`}>
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
