"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";
import { categoriesApi, Category } from "@/lib/api/categories";
import {
  catalogImportApi,
  CatalogImportItem,
  CatalogImportJob,
  CatalogItemStatus,
  SectionMapping,
} from "@/lib/api/catalogImport";

const TH = "px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
const TD = "px-3 py-2 text-sm text-gray-700 dark:text-gray-300 align-top";
const CARD = "rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]";
const INPUT =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90";

const JOB_STATUS: Record<CatalogImportJob["status"], { label: string; cls: string }> = {
  PARSING: { label: "Разбор…", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  READY: { label: "Готов к проверке", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  COMMITTING: { label: "Загрузка…", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  DONE: { label: "Загружен в базу", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  FAILED: { label: "Ошибка", cls: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
};

const ITEM_STATUS: Record<CatalogItemStatus, { label: string; cls: string; hint: string }> = {
  NEW: { label: "Новый", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", hint: "Будет создан" },
  UPDATE: { label: "Обновит", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400", hint: "Товар с таким брендом и артикулом уже есть — обновим название, фото и свойства (категорию не меняем)" },
  ONEC: { label: "Есть в 1С", cls: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400", hint: "Товар из 1С — данные не меняем, только подставим фото, если его нет" },
  DUPLICATE: { label: "Дубль в файле", cls: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400", hint: "Этот артикул уже встречался выше в каталоге" },
  EXCLUDED: { label: "Исключён", cls: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400", hint: "Снята галочка — не загружается" },
};

const Badge: React.FC<{ cls: string; title?: string; children: React.ReactNode }> = ({ cls, title, children }) => (
  <span title={title} className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
    {children}
  </span>
);

const flatten = (items: Category[], depth = 0): { category: Category; depth: number }[] =>
  items.flatMap((c) => [{ category: c, depth }, ...flatten(c.subcategories ?? [], depth + 1)]);

const errorText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "Неизвестная ошибка");

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString("ru-RU") : "—");

// ------------------------------------------------------------------ upload

const UploadCard: React.FC<{ onUploaded: (job: CatalogImportJob) => void }> = ({ onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [brand, setBrand] = useState("ÇERAY");
  const [parentId, setParentId] = useState<string>("");
  const [categories, setCategories] = useState<{ category: Category; depth: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const { error: showError } = useToast();

  useEffect(() => {
    categoriesApi.getCategoryTree().then((tree) => setCategories(flatten(tree))).catch(() => setCategories([]));
  }, []);

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const job = await catalogImportApi.upload(file, brand.trim(), parentId ? Number(parentId) : null);
      setFile(null);
      onUploaded(job);
    } catch (e) {
      showError(`Не удалось загрузить: ${errorText(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={CARD}>
      <h3 className="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">Загрузить PDF-каталог поставщика</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Каталог разбирается в фоне: артикулы, названия (с переводом на русский) и фото товаров. Перед загрузкой в базу
        вы сможете проверить и поправить каждую строку. Повторная загрузка того же каталога обновит товары, а не создаст
        дубли (сравнение по бренду и артикулу).
      </p>
      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1.5fr_auto] md:items-end">
        <label className="block text-sm">
          <span className="mb-1 block text-gray-700 dark:text-gray-400">PDF-файл</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-600 dark:text-gray-300 dark:file:bg-brand-500/15 dark:file:text-brand-400"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-700 dark:text-gray-400">Бренд</span>
          <input className={INPUT} value={brand} onChange={(e) => setBrand(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-700 dark:text-gray-400">Родительская категория (необязательно)</span>
          <select className={INPUT} value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Новая категория бренда</option>
            {categories.map(({ category, depth }) => (
              <option key={category.id} value={category.id}>
                {"  ".repeat(depth)}
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <Button className="h-10 py-0" disabled={!file || !brand.trim() || busy} onClick={submit}>
          {busy ? "Загрузка…" : "Разобрать"}
        </Button>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ jobs list

const JobsList: React.FC<{
  jobs: CatalogImportJob[];
  onOpen: (id: number) => void;
  onDelete: (job: CatalogImportJob) => void;
}> = ({ jobs, onOpen, onDelete }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="max-w-full overflow-x-auto">
      <table className="min-w-[760px] w-full">
        <thead className="border-b border-gray-100 dark:border-gray-800">
          <tr>
            <th className={TH}>Файл</th>
            <th className={TH}>Бренд</th>
            <th className={TH}>Статус</th>
            <th className={TH}>Товаров</th>
            <th className={TH}>Итог</th>
            <th className={TH}>Загружен</th>
            <th className={TH} />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {jobs.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                Каталогов ещё не загружали
              </td>
            </tr>
          )}
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
              <td className={TD}>
                <button className="text-left font-medium text-brand-500 hover:text-brand-600" onClick={() => onOpen(job.id)}>
                  {job.fileName}
                </button>
              </td>
              <td className={TD}>{job.brand}</td>
              <td className={TD}>
                <Badge cls={JOB_STATUS[job.status].cls}>
                  {JOB_STATUS[job.status].label}
                  {job.status === "PARSING" && job.pages > 0 ? ` ${job.pagesDone}/${job.pages}` : ""}
                </Badge>
              </td>
              <td className={TD}>{job.status === "PARSING" ? "—" : `${job.included} из ${job.items}`}</td>
              <td className={TD}>
                {job.committedAt ? `+${job.createdCount} новых, ${job.updatedCount} обновлено` : "—"}
              </td>
              <td className={TD}>{formatDate(job.createdAt)}</td>
              <td className={`${TD} text-right`}>
                <div className="flex justify-end gap-2">
                  <Button size="xs" variant="outline" onClick={() => onOpen(job.id)}>
                    Открыть
                  </Button>
                  <Button size="xs" variant="outline" disabled={job.status === "PARSING"} onClick={() => onDelete(job)}>
                    Удалить
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ------------------------------------------------------------------ preview row

const ItemRow: React.FC<{
  item: CatalogImportItem;
  editable: boolean;
  onPatch: (item: CatalogImportItem, patch: { name?: string; code?: string; included?: boolean }) => Promise<void>;
  onZoom: (url: string) => void;
}> = ({ item, editable, onPatch, onZoom }) => {
  const [name, setName] = useState(item.name);
  const [code, setCode] = useState(item.code);
  useEffect(() => setName(item.name), [item.name]);
  useEffect(() => setCode(item.code), [item.code]);
  const st = ITEM_STATUS[item.status];
  const dim = item.status === "DUPLICATE" || item.status === "EXCLUDED";

  return (
    <tr className={dim ? "opacity-60" : ""}>
      <td className={TD}>
        <input
          type="checkbox"
          className="size-4 accent-brand-500"
          checked={item.included}
          disabled={!editable || item.duplicateInFile}
          onChange={(e) => onPatch(item, { included: e.target.checked })}
          aria-label="Загружать строку"
        />
      </td>
      <td className={TD}>
        {item.imageUrl ? (
          <button onClick={() => onZoom(item.imageUrl!)} className="block size-16 overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.code} loading="lazy" className="size-full object-contain" />
          </button>
        ) : (
          <div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-gray-200 text-xs text-gray-400 dark:border-gray-700">
            нет фото
          </div>
        )}
      </td>
      <td className={TD}>
        <input
          className={`${INPUT} h-8 !w-[170px] font-mono text-xs`}
          value={code}
          disabled={!editable}
          onChange={(e) => setCode(e.target.value)}
          onBlur={() => code.trim() && code !== item.code && onPatch(item, { code })}
        />
        {item.altCode && (
          <div className="mt-1 text-xs text-amber-600 dark:text-amber-400" title="В английской половине каталога артикул другой — опечатка поставщика">
            EN: {item.altCode}
          </div>
        )}
      </td>
      <td className={`${TD} min-w-[320px]`}>
        <textarea
          rows={2}
          className={`${INPUT} h-auto py-1.5`}
          value={name}
          disabled={!editable}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== item.name && onPatch(item, { name })}
        />
        <div className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
          {item.nameEn && <div>EN: {item.nameEn}</div>}
          {item.nameTr && <div>TR: {item.nameTr}</div>}
          {item.note && <div className="italic">{item.note}</div>}
          {item.untranslated && (
            <div className="text-amber-600 dark:text-amber-400">Без перевода: {item.untranslated}</div>
          )}
        </div>
      </td>
      <td className={TD}>
        <div>{item.categoryName}</div>
        {item.voltage && <div className="text-xs text-gray-500 dark:text-gray-400">{item.voltage}</div>}
      </td>
      <td className={TD}>
        <Badge cls={st.cls} title={st.hint}>
          {st.label}
        </Badge>
      </td>
      <td className={`${TD} text-center`}>{item.page}</td>
    </tr>
  );
};

// ------------------------------------------------------------------ job view

const FILTERS: { key: "ALL" | CatalogItemStatus | "UNTRANSLATED"; label: string }[] = [
  { key: "ALL", label: "Все" },
  { key: "NEW", label: "Новые" },
  { key: "UPDATE", label: "Обновят" },
  { key: "ONEC", label: "Есть в 1С" },
  { key: "UNTRANSLATED", label: "Проверить перевод" },
  { key: "DUPLICATE", label: "Дубли" },
  { key: "EXCLUDED", label: "Исключены" },
];

const JobView: React.FC<{ jobId: number; onBack: () => void; onChanged: () => void }> = ({ jobId, onBack, onChanged }) => {
  const [job, setJob] = useState<CatalogImportJob | null>(null);
  const [items, setItems] = useState<CatalogImportItem[]>([]);
  const [sections, setSections] = useState<SectionMapping[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const load = useCallback(async () => {
    const j = await catalogImportApi.get(jobId);
    setJob(j);
    setSections(j.sections);
    if (j.status !== "PARSING") setItems(await catalogImportApi.items(jobId));
    return j;
  }, [jobId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let alive = true;
    const tick = async () => {
      try {
        const j = await load();
        if (alive && j.status === "PARSING") timer = setTimeout(tick, 2000);
      } catch (e) {
        showError(errorText(e));
      }
    };
    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [load, showError]);

  const editable = job?.status === "READY" || job?.status === "DONE";

  const patch = async (item: CatalogImportItem, p: { name?: string; code?: string; included?: boolean }) => {
    try {
      const updated = await catalogImportApi.updateItem(jobId, item.id, p);
      // смена артикула пересчитывает дубли — перечитываем все строки
      if (p.code !== undefined) setItems(await catalogImportApi.items(jobId));
      else setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (e) {
      showError(errorText(e));
    }
  };

  const saveSections = async () => {
    try {
      const j = await catalogImportApi.updateSections(jobId, sections);
      setJob(j);
      setSections(j.sections);
      setItems(await catalogImportApi.items(jobId));
      showSuccess("Категории разделов сохранены");
    } catch (e) {
      showError(errorText(e));
    }
  };

  const commit = async () => {
    if (!job) return;
    if (!window.confirm(`Загрузить ${job.included} товаров в базу сайта?`)) return;
    setCommitting(true);
    try {
      const r = await catalogImportApi.commit(jobId);
      showSuccess(`Готово: создано ${r.created}, обновлено ${r.updated}, пропущено ${r.skipped}, новых категорий ${r.categoriesCreated}`);
      await load();
      onChanged();
    } catch (e) {
      showError(`Не удалось загрузить: ${errorText(e)}`);
    } finally {
      setCommitting(false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: items.length, UNTRANSLATED: 0 };
    for (const i of items) {
      c[i.status] = (c[i.status] ?? 0) + 1;
      if (i.untranslated) c.UNTRANSLATED++;
    }
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (filter === "UNTRANSLATED" ? !i.untranslated : filter !== "ALL" && i.status !== filter) return false;
      if (!q) return true;
      return [i.code, i.name, i.nameEn, i.nameTr].some((v) => v?.toLowerCase().includes(q));
    });
  }, [items, filter, query]);

  if (!job) {
    return <div className={CARD}>Загрузка…</div>;
  }

  const progress = job.pages > 0 ? Math.round((job.pagesDone / job.pages) * 100) : 0;
  const sectionsDirty = sections.some((s, i) => s.categoryName !== job.sections[i]?.categoryName);

  return (
    <div className="space-y-4">
      <div className={`${CARD} flex flex-wrap items-start justify-between gap-4`}>
        <div>
          <button onClick={onBack} className="mb-2 text-sm text-brand-500 hover:text-brand-600">
            ← Все каталоги
          </button>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{job.fileName}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Badge cls={JOB_STATUS[job.status].cls}>{JOB_STATUS[job.status].label}</Badge>
            <span>Бренд: {job.brand}</span>
            <span>· Страниц: {job.pages}</span>
            {job.pagesWithoutText > 0 && <span>· без текста: {job.pagesWithoutText}</span>}
            {job.status !== "PARSING" && <span>· Строк: {job.items}, к загрузке: {job.included}</span>}
            {job.committedAt && (
              <span>
                · Загружен {formatDate(job.committedAt)}: +{job.createdCount} новых, {job.updatedCount} обновлено
              </span>
            )}
          </div>
          {job.error && <div className="mt-2 text-sm text-red-600 dark:text-red-400">{job.error}</div>}
        </div>
        {editable && (
          <Button disabled={committing || job.included === 0} onClick={commit}>
            {committing ? "Загрузка…" : job.committedAt ? "Загрузить повторно" : `Загрузить ${job.included} товаров в базу`}
          </Button>
        )}
      </div>

      {job.status === "PARSING" && (
        <div className={CARD}>
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
            Разбираем страницы: {job.pagesDone} из {job.pages || "…"}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {job.warnings.length > 0 && (
        <details className={CARD}>
          <summary className="cursor-pointer text-sm font-medium text-amber-700 dark:text-amber-400">
            Предупреждения разбора: {job.warnings.length}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
            {job.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}

      {sections.length > 0 && (
        <div className={CARD}>
          <h4 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">Разделы каталога → категории сайта</h4>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Категории создаются при загрузке внутри категории бренда (или выбранной родительской). Существующие с таким же
            названием переиспользуются.
          </p>
          <div className="space-y-2">
            {sections.map((s, idx) => (
              <div key={s.section} className="grid gap-2 md:grid-cols-[1fr_320px] md:items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {s.section || "Без раздела"} <span className="text-gray-400">· {s.items} строк</span>
                </div>
                <input
                  className={INPUT}
                  value={s.categoryName}
                  disabled={!editable}
                  onChange={(e) =>
                    setSections((prev) => prev.map((p, i) => (i === idx ? { ...p, categoryName: e.target.value } : p)))
                  }
                />
              </div>
            ))}
          </div>
          {editable && (
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" disabled={!sectionsDirty} onClick={saveSections}>
                Сохранить категории
              </Button>
            </div>
          )}
        </div>
      )}

      {job.status !== "PARSING" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-3 dark:border-gray-800">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  filter === f.key
                    ? "bg-brand-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
                }`}
              >
                {f.label} <span className="opacity-70">{counts[f.key] ?? 0}</span>
              </button>
            ))}
            <input
              className={`${INPUT} ml-auto h-9 w-64`}
              placeholder="Поиск по артикулу или названию"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className={TH} />
                  <th className={TH}>Фото</th>
                  <th className={TH}>Артикул</th>
                  <th className={TH}>Название на сайте</th>
                  <th className={TH}>Категория</th>
                  <th className={TH}>Статус</th>
                  <th className={TH}>Стр.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {visible.map((item) => (
                  <ItemRow key={item.id} item={item} editable={!!editable} onPatch={patch} onZoom={setZoom} />
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Нет строк
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-6" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-xl bg-white p-4" />
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ root

const CatalogImportManager: React.FC = () => {
  const [jobs, setJobs] = useState<CatalogImportJob[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const { success: showSuccess, error: showError } = useToast();

  const reload = useCallback(() => {
    catalogImportApi.list().then(setJobs).catch((e) => showError(errorText(e)));
  }, [showError]);

  useEffect(() => {
    reload();
  }, [reload]);

  const remove = async (job: CatalogImportJob) => {
    const msg = job.committedAt
      ? "Удалить запись об импорте? Загруженные товары останутся на сайте."
      : "Удалить разобранный каталог вместе с фото?";
    if (!window.confirm(msg)) return;
    try {
      await catalogImportApi.remove(job.id);
      showSuccess("Удалено");
      reload();
    } catch (e) {
      showError(errorText(e));
    }
  };

  if (openId != null) {
    return <JobView jobId={openId} onBack={() => { setOpenId(null); reload(); }} onChanged={reload} />;
  }

  return (
    <div className="space-y-4">
      <UploadCard onUploaded={(job) => { reload(); setOpenId(job.id); }} />
      <JobsList jobs={jobs} onOpen={setOpenId} onDelete={remove} />
    </div>
  );
};

export default CatalogImportManager;
