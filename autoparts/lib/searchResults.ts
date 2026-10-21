import type { SearchItem } from './api/search';

// Fail closed: older/unclassified payloads are never treated as confirmed trucks.
export function segmentAnalogs(items: SearchItem[], unconfirmed = false): SearchItem[] {
  return items.filter(item => item.catalog === 'UMAPI_ANALOG' && (unconfirmed
    ? item.vehicleSegment !== 'TRUCK_TRAILER' && item.vehicleSegment !== 'NON_TARGET'
    : item.vehicleSegment === 'TRUCK_TRAILER'));
}

export const partIdentity = (item: SearchItem) =>
  `${item.oem.replace(/[\s.\-/]/g, '').toUpperCase()}|${item.brand.trim().replace(/\s+/g, ' ').toUpperCase()}`;

export function availableQuantity(item: SearchItem): number | null {
  if (typeof item.quantity === 'number' && Number.isFinite(item.quantity)) return Math.max(0, item.quantity);
  const warehouses = item.warehouses ?? [];
  if (!warehouses.length || warehouses.some(w => typeof w.qty !== 'number' || !Number.isFinite(w.qty))) return null;
  return warehouses.reduce((total, w) => total + Math.max(0, w.qty), 0);
}

export function sortParts(items: SearchItem[], sort: string): SearchItem[] {
  return [...items].sort((a, b) => {
    const aq = availableQuantity(a) ?? -1;
    const bq = availableQuantity(b) ?? -1;
    const availability = Number(bq > 0) - Number(aq > 0);
    if (availability) return availability;
    if (sort === 'price') {
      const ap = a.price != null && a.price > 0 ? a.price : Infinity;
      const bp = b.price != null && b.price > 0 ? b.price : Infinity;
      if (ap !== bp) return ap < bp ? -1 : 1;
    } else if (aq !== bq) return bq - aq;
    return partIdentity(a).localeCompare(partIdentity(b), 'ru');
  });
}
