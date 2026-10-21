"use client";
import React from "react";
import { useAuthContext } from "@/context/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  USER: "Клиент",
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="mb-1 text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
        {value && value.trim() ? value : "—"}
      </dd>
    </div>
  );
}

export default function ProfileOverview() {
  const { user, loading, error, refreshUser } = useAuthContext();

  if (loading && !user) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Загрузка профиля">
        <div className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.03]" />
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.03]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-gray-700 dark:text-gray-300">
          {error ? `Не удалось загрузить профиль: ${error}` : "Не удалось загрузить профиль."}
        </p>
        <button
          type="button"
          onClick={() => refreshUser()}
          className="mt-3 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          Повторить
        </button>
      </div>
    );
  }

  const fullName = [user.surname, user.name, user.fathername].filter(Boolean).join(" ");
  const location = [user.country, user.state, user.city].filter(Boolean).join(", ");
  const initials = [user.name, user.surname]
    .filter(Boolean)
    .map((p) => (p as string).trim()[0] ?? "")
    .join("")
    .slice(0, 2) || user.email?.[0] || "?";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center lg:p-6">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-semibold uppercase text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
        >
          {initials}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {fullName || user.email}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {ROLE_LABELS[user.role] ?? user.role}
            {user.clientName ? ` · ${user.clientName}` : ""}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          Контактные данные
        </h3>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Фамилия" value={user.surname} />
          <Field label="Имя" value={user.name} />
          <Field label="Отчество" value={user.fathername} />
          <Field label="Эл. почта" value={user.email} />
          <Field label="Телефон" value={user.phone} />
          <Field label="Компания" value={user.clientName} />
          <Field label="Регион" value={location} />
          <Field label="Адрес офиса" value={user.officeAddress} />
        </dl>
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          Данные профиля меняются в разделе «Пользователи».
        </p>
      </section>
    </div>
  );
}
