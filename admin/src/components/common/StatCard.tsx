import React from "react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /** Короткая подпись под значением, например «за 30 дней» */
  hint?: React.ReactNode;
  /** Цвет значения для статусов: по умолчанию нейтральный */
  tone?: "default" | "success" | "warning" | "error";
}

const toneClass: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-gray-800 dark:text-white/90",
  success: "text-success-600 dark:text-success-500",
  warning: "text-warning-600 dark:text-warning-400",
  error: "text-error-600 dark:text-error-500",
};

/** Компактная карточка показателя. Используется во всех блоках статистики. */
export default function StatCard({ label, value, icon, hint, tone = "default" }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      {icon && (
        <span className="hidden size-10 shrink-0 items-center justify-center sm:flex rounded-lg bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300 [&>svg]:size-5">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`mt-0.5 text-lg font-semibold sm:text-xl tabular-nums ${toneClass[tone]}`}>{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}

/** Сетка карточек показателей: 2 колонки, на широких экранах 4. */
export function StatGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 xl:grid-cols-4 ${className}`}>{children}</div>
  );
}
