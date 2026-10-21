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
      setValidationError("Укажите название");
      return;
    }
    if (!formData.slug.trim()) {
      setValidationError("Укажите адрес в каталоге");
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

  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[600px] p-5">
      <div className="space-y-4">
        <h4 className="pr-10 text-lg font-semibold text-gray-800 dark:text-white/90">
          {modalTitle}
        </h4>

        {activeError && (
          <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">
            {activeError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Название *</Label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Например: Двигатель"
            />
          </div>

          <div>
            <Label>Адрес в каталоге *</Label>
            <Input
              value={formData.slug}
              onChange={(e) => {
                setSlugEdited(true);
                handleChange("slug", generateSlug(e.target.value));
              }}
              placeholder="dvigatel"
            />
          </div>

          <div>
            <Label>Родительская категория</Label>
            <select
              value={formData.parentId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                handleChange("parentId", value ? Number(value) : undefined);
              }}
              className={selectClass}
              disabled={mode === "create-subcategory" && !!parentCategory}
            >
              <option value="">Нет (основная)</option>
              {availableParents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Порядок сортировки</Label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => handleChange("sortOrder", Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div>
            <Label>Статус</Label>
            <select
              value={formData.isActive ? "active" : "inactive"}
              onChange={(e) => handleChange("isActive", e.target.value === "active")}
              className={selectClass}
            >
              <option value="active">Активна</option>
              <option value="inactive">Скрыта</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label>Изображение (ссылка)</Label>
            <Input
              value={formData.imageUrl ?? ""}
              onChange={(e) => handleChange("imageUrl", e.target.value)}
              placeholder="https://"
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Описание</Label>
            <textarea
              value={formData.description ?? ""}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryModal;
