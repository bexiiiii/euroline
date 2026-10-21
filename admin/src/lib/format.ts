// Общие форматтеры для админки. Валюта магазина: тенге (KZT).

// Не используем style: "currency": в ru-RU браузеры выводят «KZT» вместо «₸».
const kztFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

/** 125000 -> "125 000 ₸" */
export function formatKzt(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return `${kztFormatter.format(Number.isFinite(value) ? value : 0)} ₸`;
}

/** Дата и время в формате "18 окт. 2026 г., 14:05" */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
