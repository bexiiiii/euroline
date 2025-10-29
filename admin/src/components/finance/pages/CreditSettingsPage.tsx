"use client";

import React, { useEffect, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/ui/pagination/Pagination";
import CreditProfileModal from "../CreditProfileModal";
import {
  ClientBalance,
  financeApi,
} from "@/lib/api/finance";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("kk-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value || 0);

const CreditSettingsPage: React.FC = () => {
  const [items, setItems] = useState<ClientBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<ClientBalance | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, refreshKey]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await financeApi.getBalances(page - 1, pageSize);
      setItems(response.content ?? []);
      setTotalPages(response.totalPages ?? 1);
      setTotalElements(response.totalElements ?? 0);
    } catch (err) {
      console.error("Не удалось загрузить балансы", err);
      setError(err instanceof Error ? err.message : "Не удалось загрузить данные");
      setItems([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const establishment = item.establishmentName?.toLowerCase() ?? "";
      const email = item.email?.toLowerCase() ?? "";
      const id = `${item.clientId}`;
      return (
        establishment.includes(term) ||
        email.includes(term) ||
        id.includes(term)
      );
    });
  }, [items, searchTerm]);

  const openModal = (client: ClientBalance) => {
    setSelected(client);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelected(null);
    setModalOpen(false);
    setSaving(false);
    setUploading(false);
  };

  const applyUpdatedClient = (updated: ClientBalance) => {
    setItems((prev) =>
      prev.map((item) => (item.clientId === updated.clientId ? updated : item))
    );
    setSelected(updated);
  };

  const handleSaveLimit = async (limit: number) => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await financeApi.updateCreditProfile(selected.clientId, {
        creditLimit: limit,
      });
      applyUpdatedClient(updated);
      setRefreshKey((prev) => prev + 1);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveQr = async () => {
    if (!selected) return;
    setUploading(true);
    try {
      const updated = await financeApi.updateCreditProfile(selected.clientId, {
        clearQr: true,
      });
      applyUpdatedClient(updated);
      setRefreshKey((prev) => prev + 1);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadQr = async (file: File) => {
    if (!selected) return;
    setUploading(true);
    try {
      const updated = await financeApi.uploadCreditQr(selected.clientId, file);
      applyUpdatedClient(updated);
      setRefreshKey((prev) => prev + 1);
    } finally {
      setUploading(false);
    }
  };

  const availableBalance = (item: ClientBalance) =>
    Math.max((item.creditLimit ?? 0) - (item.creditUsed ?? 0), 0);

  return (
    <div className="space-y-6">
      <ComponentCard title="Кредитные лимиты клиентов">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Поиск клиента
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Название компании, email или ID клиента"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-end gap-3">
              <Button
                variant="outline"
                onClick={() => setRefreshKey((prev) => prev + 1)}
                className="whitespace-nowrap"
              >
                Обновить данные
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3 text-left">Клиент</th>
                    <th className="px-5 py-3 text-left">Контакты</th>
                    <th className="px-5 py-3 text-left">Баланс</th>
                    <th className="px-5 py-3 text-left">Лимит</th>
                    <th className="px-5 py-3 text-left">Использовано</th>
                    <th className="px-5 py-3 text-left">Доступно</th>
                    <th className="px-5 py-3 text-left">QR</th>
                    <th className="px-5 py-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-6 text-center text-gray-500">
                        Загрузка данных…
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-6 text-center text-gray-500">
                        Клиенты не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const available = availableBalance(item);
                      return (
                        <tr
                          key={item.clientId}
                          className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4 align-top">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              #{item.clientId}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {item.establishmentName || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-400">
                            <div>{item.email || "—"}</div>
                            <div>{item.phone || ""}</div>
                          </td>
                          <td className="px-5 py-4 align-top text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.balance ?? 0)}
                          </td>
                          <td className="px-5 py-4 align-top text-sm text-gray-900 dark:text-white">
                            {formatCurrency(item.creditLimit ?? 0)}
                          </td>
                          <td className="px-5 py-4 align-top text-sm text-orange-600">
                            {formatCurrency(item.creditUsed ?? 0)}
                          </td>
                          <td className="px-5 py-4 align-top text-sm text-emerald-600">
                            {formatCurrency(available)}
                          </td>
                          <td className="px-5 py-4 align-top text-sm">
                            {item.qrCodeUrl ? (
                              <a
                                href={item.qrCodeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-500"
                              >
                                Посмотреть
                              </a>
                            ) : (
                              <span className="text-gray-400">Нет</span>
                            )}
                          </td>
                          <td className="px-5 py-4 align-top text-right">
                            <Button
                              variant="outline"
                              onClick={() => openModal(item)}
                              className="whitespace-nowrap"
                            >
                              Настроить
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalElements}
              itemsPerPage={pageSize}
              onPageChange={(next) => {
                if (next >= 1 && next <= totalPages) {
                  setPage(next);
                }
              }}
            />
          </div>
        </div>
      </ComponentCard>

      <CreditProfileModal
        isOpen={modalOpen}
        client={selected}
        onClose={closeModal}
        onSaveLimit={handleSaveLimit}
        onRemoveQr={handleRemoveQr}
        onUploadQr={handleUploadQr}
        loading={saving || uploading}
      />
    </div>
  );
};

export default CreditSettingsPage;
