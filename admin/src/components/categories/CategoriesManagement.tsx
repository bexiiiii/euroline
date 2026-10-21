"use client";
import React, { useEffect, useMemo, useState } from "react";
import CategoriesStats from "@/components/categories/CategoriesStats";
import CategoriesToolbar from "@/components/categories/CategoriesToolbar";
import CategoriesTable from "@/components/categories/CategoriesTable";
import CategoryModal, { CategoryFormValues, CategoryModalMode } from "@/components/categories/CategoryModal";
import { categoriesApi, Category } from "@/lib/api/categories";
import { ApiError } from "@/lib/api";
import { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { exportAdminData } from "@/lib/api/importExport";
import { useToast } from "@/context/ToastContext";

const flattenCategories = (items: Category[]): Category[] => {
  const result: Category[] = [];
  const walk = (category: Category) => {
    result.push(category);
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(walk);
    }
  };
  items.forEach(walk);
  return result;
};

const CategoriesManagement: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalMode, setModalMode] = useState<CategoryModalMode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [, setIsOptionsLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadCategoryOptions();
  }, [refreshKey]);

  const loadCategoryOptions = async () => {
    try {
      setIsOptionsLoading(true);
      const tree = await categoriesApi.getCategoryTree();
      setCategoryOptions(flattenCategories(tree));
    } catch (error) {
      console.error("Не удалось загрузить список категорий для выбора", error);
      setCategoryOptions([]);
    } finally {
      setIsOptionsLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedCategory(null);
    setParentCategory(null);
    setModalError(null);
  };

  const openEditModal = (category: Category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setParentCategory(null);
    setModalError(null);
  };

  const openCreateSubcategoryModal = (category: Category) => {
    setModalMode("create-subcategory");
    setSelectedCategory(null);
    setParentCategory(category);
    setModalError(null);
  };

  const closeModal = () => {
    if (isModalSubmitting) return;
    setModalMode(null);
    setSelectedCategory(null);
    setParentCategory(null);
    setModalError(null);
  };

  const handleModalSubmit = async (values: CategoryFormValues) => {
    if (!modalMode) return;
    try {
      setIsModalSubmitting(true);
      setModalError(null);

      if (modalMode === "edit" && selectedCategory) {
        await categoriesApi.updateCategory(selectedCategory.id, {
          name: values.name,
          slug: values.slug,
          description: values.description,
          parentId: values.parentId,
          imageUrl: values.imageUrl,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
        });
        showSuccess("Категория обновлена");
      } else {
        await categoriesApi.createCategory({
          name: values.name,
          slug: values.slug,
          description: values.description,
          parentId: values.parentId,
          imageUrl: values.imageUrl,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
        });
        showSuccess("Категория создана");
      }

      setRefreshKey((prev) => prev + 1);
      closeModal();
    } catch (error) {
      console.error("Ошибка при сохранении категории", error);
      const message = error instanceof ApiError ? error.message : "Не удалось сохранить категорию";
      setModalError(message);
    } finally {
      setIsModalSubmitting(false);
      loadCategoryOptions();
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await categoriesApi.toggleCategoryStatus(category.id);
      showSuccess(category.isActive ? "Категория деактивирована" : "Категория активирована");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Не удалось обновить статус категории", error);
      const message = error instanceof ApiError ? error.message : "Ошибка при обновлении статуса";
      showError(message);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const confirmed = window.confirm(`Удалить категорию «${category.name}»?`);
    if (!confirmed) return;

    try {
      await categoriesApi.deleteCategory(category.id);
      showSuccess("Категория удалена");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Ошибка при удалении категории", error);
      const message = error instanceof ApiError ? error.message : "Не удалось удалить категорию";
      showError(message);
    }
  };

  const categoryNameById = useMemo(() => {
    const map: Record<number, string> = {};
    categoryOptions.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [categoryOptions]);

  const modalCategoryOptions = useMemo(() => {
    if (!modalMode) return [] as Category[];
    if (modalMode === "create-subcategory" && parentCategory) {
      return categoryOptions.filter((c) => c.id === parentCategory.id);
    }
    return categoryOptions;
  }, [categoryOptions, modalMode, parentCategory]);

  const buildFileName = (base: string, from?: string, to?: string) => {
    const parts = [base];
    if (from) parts.push(from);
    if (to && to !== from) parts.push(to);
    return `${parts.join("-")}.csv`;
  };

  const handleExportCategories = async ({ from, to }: ExportDateRange) => {
    try {
      await exportAdminData({
        type: "categories",
        from: from || undefined,
        to: to || undefined,
        fileName: buildFileName("categories", from, to),
      });
      showSuccess("Экспорт категорий сформирован");
    } catch (error) {
      console.error("Не удалось экспортировать категории", error);
      showError("Не удалось экспортировать категории");
    }
  };

  return (
    <div className="space-y-4">
      <CategoriesStats refreshKey={refreshKey} />

      <CategoriesToolbar
        onAddCategory={openCreateModal}
        onExport={handleExportCategories}
      />

      <CategoriesTable
        refreshKey={refreshKey}
        parentNameById={categoryNameById}
        onEdit={openEditModal}
        onAddSubcategory={openCreateSubcategoryModal}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteCategory}
      />

      {modalMode && (
        <CategoryModal
          isOpen={!!modalMode}
          mode={modalMode}
          category={selectedCategory}
          parentCategory={parentCategory}
          categoryOptions={modalCategoryOptions}
          onSubmit={handleModalSubmit}
          onClose={closeModal}
          isSubmitting={isModalSubmitting}
          errorMessage={modalError}
        />
      )}
    </div>
  );
};

export default CategoriesManagement;
