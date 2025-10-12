"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import ProductsStats from "@/components/products/ProductsStats";
import ProductsToolbar from "@/components/products/ProductsToolbar";
import ProductsTable from "@/components/products/ProductsTable";
import ViewProductModal from "@/components/products/ViewProductModal";
import EditProductModal from "@/components/products/EditProductModal";
import { Product } from "@/lib/api/products";
import { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { exportAdminData } from "@/lib/api/importExport";
import { useToast } from "@/context/ToastContext";

const ProductsManagement: React.FC = () => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { success: showSuccess, error: showError } = useToast();

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    console.log("Удаление продукта:", productId);
    // Здесь должна быть логика удаления продукта
  };

  const handleSaveProduct = (productId: number, newStatus: string) => {
    console.log("Сохранение статуса продукта:", productId, newStatus);
    setIsEditModalOpen(false);
  };

  const buildFileName = (base: string, from?: string, to?: string) => {
    const parts = [base];
    if (from) parts.push(from);
    if (to && to !== from) parts.push(to);
    return `${parts.join("-")}.csv`;
  };

  const handleExportProducts = async ({ from, to }: ExportDateRange) => {
    try {
      await exportAdminData({
        type: "products",
        from: from || undefined,
        to: to || undefined,
        fileName: buildFileName("products", from, to),
      });
      showSuccess("Экспорт продуктов сформирован");
    } catch (error) {
      console.error("Не удалось экспортировать продукты", error);
      showError("Не удалось экспортировать продукты");
    }
  };

  const handleImportProducts = () => {
    console.log("Импорт продуктов");
  };

  const handleSyncWith1C = () => {
    console.log("Синхронизация с 1С");
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <ProductsStats refreshKey={refreshKey} />

      {/* Панель инструментов */}
      <ProductsToolbar
        onExport={handleExportProducts}
        onImport={handleImportProducts}
        onSyncWith1C={handleSyncWith1C}
        onProductCreated={triggerRefresh}
      />

      {/* Таблица продуктов */}
      <ComponentCard title="Список продуктов">
        <ProductsTable
          refreshKey={refreshKey}
          onViewProduct={handleViewProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      </ComponentCard>

      {/* Модальные окна */}
      <ViewProductModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        product={selectedProduct}
      />

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
      />
    </div>
  );
};

export default ProductsManagement;
