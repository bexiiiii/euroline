"use client";
import React, { useState } from "react";
import ProductsStats from "@/components/products/ProductsStats";
import ProductsToolbar from "@/components/products/ProductsToolbar";
import ProductsTable from "@/components/products/ProductsTable";
import ViewProductModal from "@/components/products/ViewProductModal";
import { Product, productApi } from "@/lib/api/products";
import { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { exportAdminData } from "@/lib/api/importExport";
import { useToast } from "@/context/ToastContext";

const ProductsManagement: React.FC = () => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { success: showSuccess, error: showError } = useToast();

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Удалить товар «${product.name}»? Это действие нельзя отменить.`)) {
      return;
    }
    try {
      await productApi.deleteProduct(product.id);
      showSuccess("Товар удалён");
      triggerRefresh();
    } catch (error) {
      console.error("Не удалось удалить товар", error);
      showError(error instanceof Error && error.message ? error.message : "Не удалось удалить товар");
    }
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
      showSuccess("Экспорт товаров сформирован");
    } catch (error) {
      console.error("Не удалось экспортировать товары", error);
      showError("Не удалось экспортировать товары");
    }
  };

  return (
    <div className="space-y-4">
      <ProductsStats refreshKey={refreshKey} />

      <ProductsToolbar
        onExport={handleExportProducts}
        onProductCreated={triggerRefresh}
      />

      <ProductsTable
        refreshKey={refreshKey}
        onViewProduct={handleViewProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      <ViewProductModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        product={selectedProduct}
      />

    </div>
  );
};

export default ProductsManagement;
