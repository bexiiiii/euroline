"use client";

import React, { useCallback, useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import ReturnsStats from "./ReturnsStats";
import ReturnsToolbar from "./ReturnsToolbar";
import ReturnsTable, { ReturnTableItem, ReturnStatusLabel } from "./ReturnsTable";
import ViewReturnModal from "./ViewReturnModal";
import ProcessReturnModal from "./ProcessReturnModal";
import { returnsApi, Return as ReturnDto, ReturnStatus } from "@/lib/api/returns";
import { useToast } from "@/context/ToastContext";
import { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { downloadCsv } from "@/lib/utils/export";

type ReturnView = ReturnTableItem;

const STATUS_LABELS: Record<ReturnStatus, string> = {
  NEW: "Запрос на возврат",
  PROCESSED: "В обработке",
  APPROVED: "Одобрен",
  REJECTED: "Отклонен",
  REFUNDED: "Возврат завершен",
};

const LABEL_TO_STATUS: Record<string, ReturnStatus> = {
  "Запрос на возврат": "NEW",
  "В обработке": "PROCESSED",
  "Одобрен": "APPROVED",
  "Отклонен": "REJECTED",
  "Возврат завершен": "REFUNDED",
};

const ReturnsManagement: React.FC = () => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnView | null>(null);
  const [items, setItems] = useState<ReturnView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statsRefreshToken, setStatsRefreshToken] = useState(0);
  const { success: showSuccess, error: showError } = useToast();

  const pageSize = 10;

  const mapReturn = useCallback(
    (item: ReturnDto): ReturnView => {
      const statusCode: ReturnStatus = item.status;
      const label = (STATUS_LABELS[statusCode] ?? STATUS_LABELS.NEW) as ReturnStatusLabel;

      return {
        id: item.id,
        returnNumber: `RET-${item.id.toString().padStart(6, "0")}`,
        originalOrderNumber: item.orderId ? `ORD-${item.orderId}` : "—",
        customer: {
          name: item.customerId ? `ID ${item.customerId}` : "—",
          email: "",
          phone: "",
        },
        totalRefund: typeof item.amount === "number" ? item.amount : Number(item.amount ?? 0),
        status: label,
        statusCode,
        returnType: "Частичный возврат",
        requestDate: item.createdAt,
        reason: item.reason || "",
      };
    },
    []
  );

  const loadReturns = useCallback(
    async (pageToLoad: number = page) => {
      try {
        setLoading(true);
        setError(null);
        const response = await returnsApi.getReturns({ page: pageToLoad - 1, size: pageSize });

        if (response.totalPages > 0 && pageToLoad > response.totalPages) {
          setPage(response.totalPages);
          return;
        }

        const mapped = response.content.map(mapReturn);
        setItems(mapped);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);

        setSelectedReturn((prev) => {
          if (!prev) return prev;
          const updated = mapped.find((item) => item.id === prev.id);
          return updated ?? prev;
        });
      } catch (err) {
        console.error("Не удалось загрузить возвраты", err);
        setError(err instanceof Error ? err.message : "Не удалось загрузить возвраты");
        setItems([]);
        setTotalElements(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    [mapReturn, page, pageSize]
  );

  useEffect(() => {
    loadReturns(page);
  }, [page, loadReturns]);

  const handleViewReturn = (returnData: ReturnView) => {
    setSelectedReturn(returnData);
    setIsViewModalOpen(true);
  };

  const handleProcessReturn = (returnData: ReturnView) => {
    setSelectedReturn(returnData);
    setIsProcessModalOpen(true);
  };

  const handleUpdateReturnStatus = async (
    returnId: number,
    statusLabel: ReturnView["status"],
    refundAmount?: number,
    notes?: string
  ) => {
    const statusCode = LABEL_TO_STATUS[statusLabel] ?? "PROCESSED";
    try {
      await returnsApi.updateReturnStatus(returnId, statusCode, notes);
      await loadReturns(page);
      setStatsRefreshToken((prev) => prev + 1);
      setIsProcessModalOpen(false);
    } catch (e) {
      console.error("Не удалось обновить статус возврата", e);
    }
  };

  const handleRefreshReturns = () => {
    loadReturns(page);
    setStatsRefreshToken((prev) => prev + 1);
  };

  const handleExportReturns = async ({ from, to }: ExportDateRange) => {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      const collected: ReturnDto[] = [];
      let currentPage = 0;
      let total = 1;
      const pageSizeForExport = 200;

      while (currentPage < total && currentPage < 20) {
        const response = await returnsApi.getReturns({ page: currentPage, size: pageSizeForExport });
        collected.push(...response.content);
        total = response.totalPages || 1;
        currentPage += 1;
      }

      const filtered = collected.filter((item) => {
        if (!item.createdAt) return false;
        const created = new Date(item.createdAt);
        return created >= fromDate && created <= toDate;
      });

      if (filtered.length === 0) {
        showError("За выбранный период возвраты не найдены");
        return;
      }

      const header = ["ID", "Заказ", "Клиент", "Статус", "Сумма", "Дата", "Причина"];
      const rows = filtered.map((item) => [
        item.id,
        item.orderId ?? "",
        item.customerId ?? "",
        STATUS_LABELS[item.status] ?? item.status,
        item.amount ?? "",
        item.createdAt,
        item.reason ?? "",
      ]);

      downloadCsv(`returns-${from}-${to}`, [header, ...rows]);
      showSuccess(`Экспортировано ${rows.length} возвратов`);
    } catch (err) {
      console.error("Не удалось экспортировать возвраты", err);
      showError("Не удалось экспортировать возвраты");
    }
  };

  return (
    <div className="space-y-6">
      <ReturnsStats refreshToken={statsRefreshToken.toString()} />
      <ReturnsToolbar onExport={handleExportReturns} onRefresh={handleRefreshReturns} />
      <ComponentCard title="Список возвратов и запросов на возврат">
        {error && <div className="text-red-600 text-sm p-2">{error}</div>}
        <ReturnsTable
          data={items}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalItems={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
          onViewReturn={handleViewReturn}
          onProcessReturn={handleProcessReturn}
        />
      </ComponentCard>
      <ViewReturnModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        returnData={selectedReturn}
      />
      <ProcessReturnModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onSave={handleUpdateReturnStatus}
        returnData={selectedReturn}
      />
    </div>
  );
};

export default ReturnsManagement;
