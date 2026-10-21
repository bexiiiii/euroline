"use client";

import React, { useCallback, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/ui/pagination/Pagination";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import PreviewBannerModal from "@/components/marketing/PreviewBannerModal";
import { useProductBanners } from "@/lib/hooks/useProductBanners";
import { Banner, CreateBannerRequest } from "@/lib/api/promotions";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { formatDateTime } from "@/lib/format";
import StatCard, { StatGrid } from "@/components/common/StatCard";
import {
  DeleteIcon,
  EditIcon,
  PlusIcon,
  RowAction,
  ViewIcon,
  controlClass,
  fieldLabelClass,
  rowClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
} from "@/components/finance/tableUi";

const PAGE_SIZE = 10;

type BannerFormMode = "create" | "edit";

type BannerFormData = {
  id?: number;
  title: string;
  imageUrl: string;
  link?: string;
  status: "ACTIVE" | "INACTIVE";
  file?: File | null;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ProductBannersPage() {
  const {
    rawBanners,
    banners,
    loading,
    error,
    page,
    totalPages,
    totalElements,
    searchTerm,
    setSearchTerm,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleStatus,
    goToPage,
    refresh,
  } = useProductBanners({ pageSize: PAGE_SIZE });

  const [preview, setPreview] = useState<Banner | null>(null);
  const [formMode, setFormMode] = useState<BannerFormMode>("create");
  const [formOpen, setFormOpen] = useState(false);
const [formData, setFormData] = useState<BannerFormData>({
  title: "",
  imageUrl: "",
  link: undefined,
  status: "ACTIVE",
  file: null,
});
const [saving, setSaving] = useState(false);
const [formError, setFormError] = useState<string | null>(null);

const handleFormDataChange = useCallback(
  (next: BannerFormData, options?: { error?: string | null }) => {
    if (options && Object.prototype.hasOwnProperty.call(options, "error")) {
      setFormError(options?.error ?? null);
    }
    setFormData(next);
  },
  [setFormData, setFormError]
);

  const stats = useMemo(() => {
    const active = rawBanners.filter((banner) => banner.status === "ACTIVE").length;
    const inactive = rawBanners.length - active;
    return {
      total: totalElements,
      active,
      inactive,
    };
  }, [rawBanners, totalElements]);

  const handleCreateClick = () => {
    setFormMode("create");
    handleFormDataChange({
      title: "",
      imageUrl: "",
      link: undefined,
      status: "ACTIVE",
      file: null,
    }, { error: null });
    setFormError(null);
    setFormOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setFormMode("edit");
    handleFormDataChange({
      id: banner.id,
      title: banner.title,
      imageUrl: banner.imageUrl,
      link: banner.link,
      status: banner.status,
      file: null,
    }, { error: null });
    setFormError(null);
    setFormOpen(true);
  };

  const handlePreview = (banner: Banner) => {
    setPreview(banner);
  };

  const handleToggleStatus = async (banner: Banner) => {
    await toggleStatus(banner.id);
  };

  const handleDelete = async (banner: Banner) => {
    const confirmed = window.confirm(`Удалить баннер «${banner.title}»?`);
    if (!confirmed) return;
    await deleteBanner(banner.id);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setFormError("Введите заголовок баннера");
      return;
    }
    const hasFile = !!formData.file;
    const hasImageUrl = !!formData.imageUrl?.trim?.();
    if (!hasFile && !hasImageUrl) {
      setFormError("Загрузите изображение или укажите ссылку на него");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      let success = false;
      const trimmedLink = formData.link?.trim();
      const trimmedImageUrl = formData.imageUrl?.trim?.();

      if (formMode === "create") {
        const payload: CreateBannerRequest = {
          title: formData.title.trim(),
          imageUrl: hasFile ? undefined : trimmedImageUrl || undefined,
          link: trimmedLink || undefined,
          status: formData.status,
        };
        const result = await createBanner(payload, formData.file ?? undefined);
        success = !!result;
      } else if (formData.id !== undefined) {
        const result = await updateBanner(
          formData.id,
          {
            title: formData.title.trim(),
            imageUrl: hasFile ? undefined : trimmedImageUrl || undefined,
            link: trimmedLink || undefined,
            status: formData.status,
          },
          formData.file ?? undefined
        );
        success = !!result;
      }

      if (success) {
        setFormOpen(false);
        handleFormDataChange({
          title: "",
          imageUrl: "",
          link: undefined,
          status: "ACTIVE",
          file: null,
        }, { error: null });
      } else {
        setFormError("Не удалось сохранить баннер");
      }
    } catch (err) {
      console.error(err);
      setFormError("Не удалось сохранить баннер");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500 dark:border-gray-800 dark:border-t-brand-500"></div>
      </div>
    );
  }

  const stateRow = (text: string) => (
    <tr>
      <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {text}
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard
          label="Всего баннеров"
          value={stats.total}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 15 5-5 4 4 3-3 6 6" />
            </svg>
          }
        />
        {/* Счетчики по статусу точны только когда все баннеры на одной странице */}
        {totalPages <= 1 && (
          <>
            <StatCard
              label="Активные"
              value={stats.active}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8.5 12 2.5 2.5 4.5-5" />
                </svg>
              }
            />
            <StatCard
              label="Выключены"
              value={stats.inactive}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 9v6M15 9v6" />
                </svg>
              }
            />
          </>
        )}
      </StatGrid>

      <ComponentCard title="Баннеры главной страницы">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Поиск баннеров"
              aria-label="Поиск баннеров"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`${controlClass} w-full pl-9`}
            />
            <svg
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <div className="ml-auto">
            <Button size="sm" startIcon={<PlusIcon />} onClick={handleCreateClick}>
              Добавить баннер
            </Button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
          >
            <span>Не удалось загрузить данные</span>
            <Button size="xs" variant="outline" onClick={() => { void refresh(); }}>
              Повторить
            </Button>
          </div>
        )}

        <div className={tableWrapClass}>
          <table className="w-full min-w-[760px]">
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Превью</th>
                <th className={thClass}>Заголовок</th>
                <th className={thClass}>Статус</th>
                <th className={thClass}>Создан</th>
                <th className={`${thClass} text-right`}>Действия</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {banners.length === 0
                ? stateRow(
                    error && rawBanners.length === 0
                      ? "Данные недоступны"
                      : searchTerm.trim()
                        ? "Ничего не найдено"
                        : "Баннеров пока нет"
                  )
                : banners.map((banner) => {
                    const isActive = banner.status === "ACTIVE";
                    return (
                      <tr key={banner.id} className={rowClass}>
                        <td className={tdClass}>
                          <div className="h-10 w-20 overflow-hidden rounded-md border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
                            <ImageWithFallback
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="h-full w-full object-cover"
                              fallback={
                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                  <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                    <path d="m3 15 5-5 4 4 3-3 6 6" />
                                  </svg>
                                </div>
                              }
                            />
                          </div>
                        </td>
                        <td className={tdClass}>
                          <div className="font-medium text-gray-800 dark:text-white/90">{banner.title || "Без названия"}</div>
                          {banner.link && (
                            <div className="line-clamp-1 max-w-[280px] break-all text-xs text-gray-500 dark:text-gray-400" title={banner.link}>
                              {banner.link}
                            </div>
                          )}
                        </td>
                        <td className={tdClass}>
                          <Badge size="sm" color={isActive ? "success" : "light"}>{isActive ? "Активен" : "Выключен"}</Badge>
                        </td>
                        <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(banner.createdAt)}</td>
                        <td className={tdClass}>
                          <div className="flex items-center justify-end gap-1">
                            <RowAction label={`Просмотреть баннер «${banner.title}»`} onClick={() => handlePreview(banner)}>
                              <ViewIcon />
                            </RowAction>
                            <RowAction label={`Редактировать баннер «${banner.title}»`} onClick={() => handleEdit(banner)}>
                              <EditIcon />
                            </RowAction>
                            <RowAction
                              label={isActive ? `Выключить баннер «${banner.title}»` : `Включить баннер «${banner.title}»`}
                              onClick={() => { void handleToggleStatus(banner); }}
                            >
                              {isActive ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <circle cx="12" cy="12" r="9" />
                                  <path d="M10 9v6M14 9v6" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <circle cx="12" cy="12" r="9" />
                                  <path d="m10 8.5 5 3.5-5 3.5z" />
                                </svg>
                              )}
                            </RowAction>
                            <RowAction label={`Удалить баннер «${banner.title}»`} onClick={() => { void handleDelete(banner); }} destructive>
                              <DeleteIcon />
                            </RowAction>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={page + 1}
            totalPages={totalPages}
            totalItems={totalElements}
            itemsPerPage={PAGE_SIZE}
            onPageChange={(nextPage) => goToPage(nextPage - 1)}
          />
        )}
      </ComponentCard>

      <PreviewBannerModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        bannerData={preview ? {
          id: preview.id,
          title: preview.title,
          description: preview.link || preview.title,
          imageUrl: preview.imageUrl,
          linkUrl: preview.link || "",
          position: "header",
          displayType: "image",
          startDate: preview.createdAt,
          endDate: preview.createdAt,
          status: preview.status === "ACTIVE" ? "active" : "paused",
          priority: 0,
          clickCount: 0,
          impressionCount: 0,
          ctr: 0,
          targetAudience: "",
          createdBy: "",
          createdDate: preview.createdAt,
        } : null}
      />

      <BannerFormModal
        open={formOpen}
        mode={formMode}
        data={formData}
        saving={saving}
        error={formError}
        onChange={handleFormDataChange}
        onClose={() => {
          setFormOpen(false);
          setFormError(null);
          handleFormDataChange({
            title: "",
            imageUrl: "",
            link: undefined,
            status: "ACTIVE",
            file: null,
          }, { error: null });
        }}
        onSave={handleSave}
      />
    </div>
  );
}

interface BannerFormModalProps {
  open: boolean;
  mode: BannerFormMode;
  data: BannerFormData;
  saving: boolean;
  error: string | null;
  onChange: (data: BannerFormData, options?: { error?: string | null }) => void;
  onClose: () => void;
  onSave: () => void;
}

const BannerFormModal: React.FC<BannerFormModalProps> = ({
  open,
  mode,
  data,
  saving,
  error,
  onChange,
  onClose,
  onSave,
}) => {
  const previewUrl = React.useMemo(() => {
    if (data.file) {
      return URL.createObjectURL(data.file);
    }
    return data.imageUrl;
  }, [data.file, data.imageUrl]);

  React.useEffect(() => {
    if (!data.file) return;
    return () => {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    };
  }, [data.file, previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_IMAGE_SIZE) {
      onChange({ ...data, file: null }, {
        error: `Файл больше ${(MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0)} МБ`,
      });
      try { event.target.value = ""; } catch {}
      return;
    }
    onChange({ ...data, file }, { error: null });
  };

  const segmentClass = (active: boolean) =>
    `h-8 rounded-md px-3 text-sm font-medium transition-colors ${
      active
        ? "bg-white text-gray-800 shadow-theme-xs dark:bg-gray-800 dark:text-white/90"
        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    }`;

  return (
    <Modal isOpen={open} onClose={onClose} size="md" className="p-0">
      <div className="space-y-4 p-5">
        <h2 className="pr-12 text-base font-semibold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Новый баннер" : "Редактирование баннера"}
        </h2>

        {error && (
          <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="banner-title" className={fieldLabelClass}>Заголовок</label>
          <input
            id="banner-title"
            type="text"
            value={data.title}
            onChange={(event) => onChange({ ...data, title: event.target.value })}
            className={`${controlClass} w-full`}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="banner-link" className={fieldLabelClass}>Ссылка</label>
            <input
              id="banner-link"
              type="text"
              value={data.link ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                onChange({ ...data, link: value ? value : undefined });
              }}
              className={`${controlClass} w-full`}
              placeholder="https://"
            />
          </div>
          <div>
            <span className={fieldLabelClass}>Статус</span>
            <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/[0.04]" role="group" aria-label="Статус баннера">
              <button
                type="button"
                aria-pressed={data.status === "ACTIVE"}
                onClick={() => onChange({ ...data, status: "ACTIVE" })}
                className={segmentClass(data.status === "ACTIVE")}
              >
                Активен
              </button>
              <button
                type="button"
                aria-pressed={data.status === "INACTIVE"}
                onClick={() => onChange({ ...data, status: "INACTIVE" })}
                className={segmentClass(data.status === "INACTIVE")}
              >
                Выключен
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="banner-file" className="text-sm font-medium text-gray-700 dark:text-gray-300">Изображение</label>
            {data.file && (
              <button
                type="button"
                onClick={() => onChange({ ...data, file: null })}
                className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
              >
                Убрать файл
              </button>
            )}
          </div>
          <input
            id="banner-file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-3 file:h-10 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-400 dark:file:bg-white/[0.06] dark:file:text-gray-300"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG или WebP, 1200×400</p>
          {previewUrl && (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
              <img src={previewUrl} alt="Превью баннера" className="h-32 w-full object-cover" />
            </div>
          )}
          <input
            type="text"
            value={data.imageUrl}
            onChange={(event) => onChange({ ...data, imageUrl: event.target.value })}
            className={`${controlClass} w-full`}
            placeholder="Или ссылка на изображение"
            aria-label="Ссылка на изображение"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
