"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { ClientBalance } from "@/lib/api/finance";

interface CreditProfileModalProps {
  isOpen: boolean;
  client: ClientBalance | null;
  onClose: () => void;
  onSaveLimit: (limit: number) => Promise<void>;
  onRemoveQr: () => Promise<void>;
  onUploadQr: (file: File) => Promise<void>;
  loading?: boolean;
}

const fmtKzt = (value: number) =>
  new Intl.NumberFormat("kk-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value || 0);

const CreditProfileModal: React.FC<CreditProfileModalProps> = ({
  isOpen,
  client,
  onClose,
  onSaveLimit,
  onRemoveQr,
  onUploadQr,
  loading = false,
}) => {
  const [limitInput, setLimitInput] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setUploadError(null);
      setUploading(false);
      return;
    }
    const limit = client?.creditLimit ?? 0;
    setLimitInput(limit.toString());
    setError(null);
    setUploadError(null);
  }, [isOpen, client?.creditLimit]);

  const debtInfo = useMemo(() => {
    if (!client) return null;
    const used = client.creditUsed ?? 0;
    const available = Math.max((client.creditLimit ?? 0) - used, 0);
    return { used, available };
  }, [client]);

  const handleSaveLimit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!client) return;
    const normalized = limitInput.replace(/\s+/g, "");
    const numericValue = Number(normalized);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setError("Введите корректный лимит (неотрицательное число)");
      return;
    }
    if ((client.creditUsed ?? 0) > numericValue) {
      setError("Текущий долг превышает новый лимит. Сначала погасите задолженность.");
      return;
    }
    setError(null);
    try {
      await onSaveLimit(numericValue);
    } catch (err) {
      console.error("Не удалось сохранить лимит клиента", err);
      setError(err instanceof Error ? err.message : "Не удалось сохранить лимит");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await onUploadQr(file);
    } catch (err) {
      console.error("Ошибка загрузки QR", err);
      setUploadError(err instanceof Error ? err.message : "Не удалось загрузить QR-код");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveQr = async () => {
    setUploadError(null);
    setUploading(true);
    try {
      await onRemoveQr();
    } catch (err) {
      console.error("Ошибка удаления QR", err);
      setUploadError(err instanceof Error ? err.message : "Не удалось удалить QR-код");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !client) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" className="p-0">
      <div className="flex flex-col gap-6 p-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Настройка лимита и QR-кода
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Клиент #{client.clientId}
            {client.establishmentName ? ` · ${client.establishmentName}` : ""}
          </p>
        </div>

        <form onSubmit={handleSaveLimit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Кредитный лимит, ₸
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={limitInput}
              onChange={(event) => setLimitInput(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Текущий долг:{" "}
              <span className="font-semibold text-orange-600">
                {fmtKzt(debtInfo?.used ?? 0)}
              </span>
              . Доступно без пополнения:{" "}
              <span className="font-semibold text-emerald-600">
                {fmtKzt(debtInfo?.available ?? 0)}
              </span>
              .
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              Сохранить лимит
            </Button>
          </div>
        </form>

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
            Персональный QR-код
          </h3>
          {client.qrCodeUrl ? (
            <div className="space-y-3">
              <img
                src={client.qrCodeUrl}
                alt="QR код клиента"
                className="h-48 w-48 rounded-lg border border-gray-200 object-contain dark:border-white/[0.05]"
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  disabled={uploading || loading}
                  onClick={handleRemoveQr}
                >
                  Удалить QR
                </Button>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-300">
                  Заменить QR
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading || loading}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Для клиента ещё не загружен персональный QR-код. Загрузите файл, чтобы выдавать индивидуальные реквизиты для оплаты.
              </p>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-300">
                Загрузить QR
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading || loading}
                />
              </label>
            </div>
          )}
          {(uploadError || uploading) && (
            <p className="text-sm text-red-600">
              {uploading ? "Загрузка файла…" : uploadError}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CreditProfileModal;
