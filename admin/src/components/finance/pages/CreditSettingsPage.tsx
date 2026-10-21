"use client";

import React, { useEffect, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/ui/pagination/Pagination";
import CreditProfileModal from "../CreditProfileModal";
import FinanceLoadError from "../FinanceLoadError";
import {
  EditIcon,
  RefreshIcon,
  RowAction,
  controlClass,
  rowClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
} from "../tableUi";
import {
  ClientBalance,
  financeApi,
} from "@/lib/api/finance";
import { formatKzt } from "@/lib/format";

const formatCurrency = (value: number) => formatKzt(value || 0);

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
      setError("Не удалось загрузить данные");
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

  const stateRow = (text: string) => (
    <tr>
      <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {text}
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      <ComponentCard title="Клиенты">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Компания, email или ID"
            aria-label="Поиск клиента по компании, email или ID"
            className={`${controlClass} min-w-[220px] flex-1`}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            startIcon={<RefreshIcon />}
          >
            Обновить
          </Button>
        </div>

        {error && (
          <FinanceLoadError
            message={error}
            onRetry={() => setRefreshKey((prev) => prev + 1)}
          />
        )}

        <div className={tableWrapClass}>
          <table className="w-full min-w-[820px]">
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Клиент</th>
                <th className={thClass}>Баланс</th>
                <th className={thClass}>Лимит</th>
                <th className={thClass}>Использовано</th>
                <th className={thClass}>Доступно</th>
                <th className={thClass}>QR</th>
                <th className={`${thClass} text-right`}>Действия</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {loading
                ? stateRow("Загрузка…")
                : error
                  ? stateRow("Данные недоступны")
                  : filteredItems.length === 0
                    ? stateRow("Клиенты не найдены")
                    : filteredItems.map((item) => (
                        <tr key={item.clientId} className={rowClass}>
                          <td className={tdClass}>
                            <div className="font-medium text-gray-800 dark:text-white/90">
                              {item.establishmentName || `Клиент #${item.clientId}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {[item.email, item.phone].filter(Boolean).join(", ") || `ID ${item.clientId}`}
                            </div>
                          </td>
                          <td className={`${tdClass} font-medium tabular-nums text-gray-800 dark:text-white/90`}>
                            {formatCurrency(item.balance ?? 0)}
                          </td>
                          <td className={`${tdClass} tabular-nums`}>{formatCurrency(item.creditLimit ?? 0)}</td>
                          <td className={`${tdClass} tabular-nums`}>{formatCurrency(item.creditUsed ?? 0)}</td>
                          <td className={`${tdClass} tabular-nums`}>{formatCurrency(availableBalance(item))}</td>
                          <td className={tdClass}>
                            {item.qrCodeUrl ? (
                              <a
                                href={item.qrCodeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                              >
                                Открыть
                              </a>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">Нет</span>
                            )}
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <RowAction label={`Настроить лимит клиента #${item.clientId}`} onClick={() => openModal(item)}>
                              <EditIcon />
                            </RowAction>
                          </td>
                        </tr>
                      ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
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
        )}
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
