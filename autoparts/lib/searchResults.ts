import type { SearchItem } from './api/search';

export const partIdentity = (item: SearchItem) =>
  `${item.oem.replace(/[\s.\-/]/g, '').toUpperCase()}|${item.brand.trim().replace(/\s+/g, ' ').toUpperCase()}`;

export function availableQuantity(item: SearchItem): number | null {
  if (typeof item.quantity === 'number' && Number.isFinite(item.quantity)) return Math.max(0, item.quantity);
  const warehouses = item.warehouses ?? [];
  if (!warehouses.length || warehouses.some(w => typeof w.qty !== 'number' || !Number.isFinite(w.qty))) return null;
  return warehouses.reduce((total, w) => total + Math.max(0, w.qty), 0);
}

/** Замена найдена по общему OE-номеру, а не прямым кроссом производителя. */
export const isSharedOeAnalog = (item: SearchItem) => item.analogSource === 'UMAPI_SHARED_OE';

export const inStock = (item: SearchItem) => (availableQuantity(item) ?? 0) > 0;

/** Бренды, которые среди аналогов всегда показываем первыми (просьба заказчика: AUGER). */
const PRIORITY_ANALOG_BRANDS = ['AUGER'];
const analogPriority = (item: SearchItem) => {
  const index = PRIORITY_ANALOG_BRANDS.indexOf(item.brand.trim().toUpperCase());
  return index < 0 ? PRIORITY_ANALOG_BRANDS.length : index;
};

/**
 * Аналоги: сначала приоритетные бренды (AUGER), затем всё, что есть в наличии, затем остальные — по алфавиту,
 * независимо от источника (прямой кросс или общий OE).
 */
export function sortAnalogs(items: SearchItem[], sort: string): SearchItem[] {
  const sorted = sortParts(items, sort);
  return sorted
    .map((item, order) => ({ item, order }))
    .sort((a, b) => analogPriority(a.item) - analogPriority(b.item) || a.order - b.order)
    .map(({ item }) => item);
}

export function sortParts(items: SearchItem[], sort: string): SearchItem[] {
  // A–Z по латинице (бренды латиницей); с 'ru' латиница уходила после кириллицы и порядок «прыгал»
  const alphabetical = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  return [...items].sort((a, b) => {
    const availability = Number(inStock(b)) - Number(inStock(a));
    if (availability) return availability;
    if (sort === 'price') {
      const ap = a.price != null && a.price > 0 ? a.price : Infinity;
      const bp = b.price != null && b.price > 0 ? b.price : Infinity;
      if (ap !== bp) return ap < bp ? -1 : 1;
    }
    // Stock is a yes/no priority. Quantity must not override alphabetical order within a group.
    return alphabetical.compare(a.brand.trim(), b.brand.trim())
      || alphabetical.compare(a.oem, b.oem)
      || alphabetical.compare(a.name ?? '', b.name ?? '');
  });
}
