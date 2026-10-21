"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { ClientBalance } from "@/lib/api/finance";
import { formatKzt } from "@/lib/format";
import { controlClass, fieldLabelClass } from "./tableUi";

interface CreditProfileModalProps {
  isOpen: boolean;
  client: ClientBalance | null;
  onClose: () => void;
  onSaveLimit: (limit: number) => Promise<void>;
  onRemoveQr: () => Promise<void>;
  onUploadQr: (file: File) => Promise<void>;
  loading?: boolean;
}


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
      setError("Введите неотрицательное число");
      return;
    }
    if ((client.creditUsed ?? 0) > numericValue) {
      setError("Текущий долг больше нового лимита");
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

  const uploadLabelClass =
    "inline-flex h-10 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="p-0">
      <div className="flex flex-col gap-4 p-5">
        <div className="pr-12">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Кредитный лимит и QR</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {client.establishmentName || `Клиент #${client.clientId}`}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Долг</dt>
            <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">{formatKzt(debtInfo?.used ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Доступно</dt>
            <dd className="font-medium tabular-nums text-gray-800 dark:text-white/90">{formatKzt(debtInfo?.available ?? 0)}</dd>
          </div>
        </dl>

        <form onSubmit={handleSaveLimit} className="space-y-3">
          <div>
            <label htmlFor="credit-limit" className={fieldLabelClass}>
              Кредитный лимит, ₸
            </label>
            <input
              id="credit-limit"
              type="number"
              min={0}
              step={1000}
              value={limitInput}
              onChange={(event) => setLimitInput(event.target.value)}
              className={`${controlClass} w-full`}
            />
          </div>
          {error && <p className="text-sm text-error-600 dark:text-error-500">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              Сохранить
            </Button>
          </div>
        </form>

        <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">QR-код для оплаты</h3>
          {client.qrCodeUrl ? (
            <img
              src={client.qrCodeUrl}
              alt="QR-код клиента"
              className="size-40 rounded-lg border border-gray-200 object-contain dark:border-gray-800"
            />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">QR-код не загружен</p>
          )}
          <div className="flex flex-wrap gap-2">
            <label className={uploadLabelClass}>
              {client.qrCodeUrl ? "Заменить" : "Загрузить"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading || loading}
              />
            </label>
            {client.qrCodeUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="hover:text-error-600"
                disabled={uploading || loading}
                onClick={handleRemoveQr}
              >
                Удалить
              </Button>
            )}
          </div>
          {uploading && <p className="text-sm text-gray-500 dark:text-gray-400">Загрузка файла…</p>}
          {!uploading && uploadError && (
            <p className="text-sm text-error-600 dark:text-error-500">{uploadError}</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CreditProfileModal;
