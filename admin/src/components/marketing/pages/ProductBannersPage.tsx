"use client";

import React, { useCallback, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Pagination from "@/components/ui/pagination/Pagination";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import PreviewBannerModal from "@/components/marketing/PreviewBannerModal";
import { useProductBanners } from "@/lib/hooks/useProductBanners";
import { Banner, CreateBannerRequest } from "@/lib/api/promotions";

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
    const withLink = rawBanners.filter((banner) => !!banner.link).length;
    return {
      total: totalElements,
      active,
      inactive,
      withLink,
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Поиск баннеров..."
            value={searchTerm}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <Button
          startIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
          onClick={handleCreateClick}
        >
          Добавить баннер
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <BannerStatCard label="Всего баннеров" value={stats.total} tone="brand" />
        <BannerStatCard label="Активные" value={stats.active} tone="success" />
        <BannerStatCard label="Выключены" value={stats.inactive} tone="warning" />
        <BannerStatCard label="Со ссылкой" value={stats.withLink} tone="info" />
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Баннеры главной страницы</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">Используются в клиентской карусели</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.05]">
          <div className="max-w-full overflow-x-auto">
            <Table className="min-w-[880px] divide-y divide-gray-200 dark:divide-white/[0.05]">
              <TableHeader className="bg-gray-50 dark:bg-white/[0.03]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Превью
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Заголовок
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Статус
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Ссылка
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Создан
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Действия
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 dark:divide-white/[0.05] bg-white dark:bg-white/[0.02]">
                {banners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Баннеров пока нет. Добавьте баннер, чтобы он появился в карусели.
                    </TableCell>
                  </TableRow>
                ) : (
                  banners.map((banner) => {
                    const isActive = banner.status === "ACTIVE";
                    return (
                      <TableRow key={banner.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.03]">
                        <TableCell className="px-5 py-4">
                          <div className="h-14 w-24 overflow-hidden rounded-lg border border-gray-100 bg-gray-100 dark:border-white/[0.06] dark:bg-white/[0.03]">
                            {banner.imageUrl ? (
                              <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  (event.target as HTMLImageElement).style.opacity = "0.4";
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{banner.title || "Без названия"}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">ID: {banner.id}</div>
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <Badge color={isActive ? "success" : "light"}>{isActive ? "Активен" : "Выключен"}</Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle text-sm text-gray-600 dark:text-gray-300">
                          {banner.link ? (
                            <span className="line-clamp-1 max-w-[240px] break-all text-brand-600 dark:text-brand-300">{banner.link}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle text-sm text-gray-600 dark:text-gray-300">
                          {new Date(banner.createdAt).toLocaleString("ru-RU")}
                        </TableCell>
                        <TableCell className="px-5 py-4 align-middle">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(banner)}
                              className="border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 dark:border-white/[0.08] dark:text-gray-300"
                            >
                              Просмотр
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(banner)}
                              className="border-gray-200 text-gray-600 hover:border-brand-500 hover:text-brand-600 dark:border-white/[0.08] dark:text-gray-300"
                            >
                              Изменить
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(banner)}
                              className="border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 dark:border-white/[0.08] dark:text-gray-300"
                            >
                              {isActive ? "Выключить" : "Включить"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(banner)}
                              className="border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300"
                            >
                              Удалить
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/[0.05]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Показано {banners.length} из {totalElements} баннеров
            </p>
            <Pagination
              currentPage={page + 1}
              totalPages={totalPages}
              totalItems={totalElements}
              itemsPerPage={PAGE_SIZE}
              onPageChange={(nextPage) => goToPage(nextPage - 1)}
            />
          </div>
        )}
      </div>

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

interface BannerStatCardProps {
  label: string;
  value: number;
  tone: "brand" | "success" | "warning" | "info";
}

const BannerStatCard: React.FC<BannerStatCardProps> = ({ label, value, tone }) => {
  const toneClasses: Record<BannerStatCardProps["tone"], string> = {
    brand: "text-brand-500 bg-brand-50 dark:text-brand-200 dark:bg-brand-900/20",
    success: "text-emerald-500 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-900/20",
    warning: "text-amber-500 bg-amber-50 dark:text-amber-200 dark:bg-amber-900/20",
    info: "text-blue-500 bg-blue-50 dark:text-blue-200 dark:bg-blue-900/20",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>шт.</span>
      </div>
    </div>
  );
};

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
        error: `Размер файла превышает ${(MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0)} МБ. Пожалуйста, выберите файл меньшего размера.`,
      });
      try { event.target.value = ""; } catch {}
      return;
    }
    onChange({ ...data, file }, { error: null });
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="lg">
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === "create" ? "Новый баннер" : "Редактирование баннера"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Баннеры отображаются в слайдере на главной странице клиентского приложения.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-900/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Заголовок *</label>
            <input
              type="text"
              value={data.title}
              onChange={(event) => onChange({ ...data, title: event.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.05] dark:bg-white/[0.02]"
              placeholder="Например, Скидки на зимние шины"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ссылка (опционально)</label>
            <input
              type="text"
              value={data.link ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                onChange({ ...data, link: value ? value : undefined });
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.05] dark:bg-white/[0.02]"
              placeholder="https://"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Изображение *</label>
            <div className="space-y-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm dark:border-white/[0.1] dark:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.05] dark:bg-white/[0.02]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange({ ...data, file: null })}
                  className="border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-white/[0.08] dark:text-gray-300"
                >
                  Очистить
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Загрузите JPG, PNG или WebP. Рекомендуемый размер 1200×400.
              </p>
              {previewUrl && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.02]">
                  <img src={previewUrl} alt="Превью баннера" className="h-40 w-full object-cover" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Или используйте ссылку на изображение</label>
                <input
                  type="text"
                  value={data.imageUrl}
                  onChange={(event) => onChange({ ...data, imageUrl: event.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.05] dark:bg-white/[0.02]"
                  placeholder="https://cdn.domain.kz/banner.jpg"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/[0.05] dark:bg-white/[0.04]">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Статус</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Активные баннеры сразу попадают в клиентскую карусель.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...data, status: "INACTIVE" })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  data.status === "INACTIVE"
                    ? "border-gray-300 bg-white text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-100"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-500"
                }`}
              >
                Выключен
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...data, status: "ACTIVE" })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  data.status === "ACTIVE"
                    ? "border-brand-400 bg-brand-500/10 text-brand-600 dark:border-brand-700/60 dark:bg-brand-500/10 dark:text-brand-200"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-500"
                }`}
              >
                Активен
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-white/[0.05]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 dark:border-white/[0.08] dark:text-gray-300"
          >
            Отменить
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
