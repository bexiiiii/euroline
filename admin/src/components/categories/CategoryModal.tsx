"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import type { Category } from "@/lib/api/categories";

export type CategoryModalMode = "create" | "edit" | "create-subcategory";

export interface CategoryFormValues {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  parentId?: number;
  isActive: boolean;
}

interface CategoryModalProps {
  isOpen: boolean;
  mode: CategoryModalMode;
  category?: Category | null;
  parentCategory?: Category | null;
  categoryOptions: Category[];
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
  onClose: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

const initialFormState: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  sortOrder: 0,
  parentId: undefined,
  isActive: true,
};

const generateSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\d]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  mode,
  category,
  parentCategory,
  categoryOptions,
  onSubmit,
  onClose,
  isSubmitting = false,
  errorMessage,
}) => {
  const [formData, setFormData] = useState<CategoryFormValues>(initialFormState);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

  const availableParents = useMemo(() => {
    const withoutSelf = categoryOptions.filter((item) => item.id !== category?.id);
    return withoutSelf.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [category?.id, categoryOptions]);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setValidationError(null);
      setSlugEdited(false);
      return;
    }

    if (category && mode === "edit") {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        imageUrl: category.imageUrl ?? "",
        sortOrder: category.sortOrder ?? 0,
        parentId: category.parentId ?? undefined,
        isActive: category.isActive,
      });
      setSlugEdited(true);
      setValidationError(null);
    } else if (mode === "create-subcategory" && parentCategory) {
      setFormData({
        ...initialFormState,
        parentId: parentCategory.id,
      });
      setValidationError(null);
      setSlugEdited(false);
    } else {
      setFormData(initialFormState);
      setValidationError(null);
      setSlugEdited(false);
    }
  }, [category, isOpen, mode, parentCategory]);

  const isSubcategoryMode = mode === "create-subcategory" || !!formData.parentId;

  const handleChange = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNameChange = (value: string) => {
    handleChange("name", value);
    if (!slugEdited) {
      const slug = generateSlug(value);
      handleChange("slug", slug);
    }
  };

  const modalTitle = (() => {
    switch (mode) {
      case "edit":
        return "Редактировать категорию";
      case "create-subcategory":
        return "Создать подкатегорию";
      default:
        return "Создать категорию";
    }
  })();

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setValidationError("Введите название категории");
      return;
    }
    if (!formData.slug.trim()) {
      setValidationError("Slug обязателен");
      return;
    }

    setValidationError(null);

    const payload: CategoryFormValues = {
      ...formData,
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      sortOrder: Number.isFinite(formData.sortOrder) ? formData.sortOrder : 0,
      parentId: formData.parentId ?? undefined,
      description: formData.description?.trim() || undefined,
      imageUrl: formData.imageUrl?.trim() || undefined,
    };

    await onSubmit(payload);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const activeError = validationError || errorMessage;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[640px] p-6">
      <div className="space-y-6">
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {modalTitle}
        </h4>

        {activeError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {activeError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-5">
            <div>
              <Label>Название категории *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Например: Двигатель"
              />
            </div>

            <div>
              <Label>Slug *</Label>
              <Input
                value={formData.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  handleChange("slug", generateSlug(e.target.value));
                }}
                placeholder="naprimer-dvigatel"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Используется в URL. Допустимы буквы, цифры и дефис.
              </p>
            </div>

            <div>
              <Label>Порядок сортировки</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => handleChange("sortOrder", Number(e.target.value))}
                placeholder="0"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Чем меньше число, тем выше категория в списке.
              </p>
            </div>

            <div>
              <Label>Статус</Label>
              <select
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) => handleChange("isActive", e.target.value === "active")}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="active">Активна</option>
                <option value="inactive">Неактивна</option>
              </select>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label>Родительская категория</Label>
              <select
                value={formData.parentId ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange("parentId", value ? Number(value) : undefined);
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                disabled={mode === "create-subcategory" && !!parentCategory}
              >
                <option value="">Без родителя (основная категория)</option>
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
              {mode === "create-subcategory" && parentCategory && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Подкатегория для: <span className="font-medium">{parentCategory.name}</span>
                </p>
              )}
            </div>

            <div>
              <Label>Описание</Label>
              <textarea
                value={formData.description ?? ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                placeholder="Краткое описание категории..."
                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <Label>Изображение (URL)</Label>
              <Input
                value={formData.imageUrl ?? ""}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                placeholder="https://example.com/images/category.jpg"
              />
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-900/10">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                Подсказки
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-blue-700 dark:text-blue-300">
                <li>Активные категории отображаются в каталоге.</li>
                <li>При деактивации категории товары становятся недоступными.</li>
                <li>Slug можно изменить без потери данных.</li>
                {isSubcategoryMode && <li>Подкатегория наследует доступность родителя.</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button size="sm" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" strokeWidth="4" />
                <path d="M22 12a10 10 0 00-10-10" strokeWidth="4" strokeLinecap="round" />
              </svg>
            )}
            {mode === "edit" ? "Сохранить изменения" : "Сохранить категорию"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryModal;
