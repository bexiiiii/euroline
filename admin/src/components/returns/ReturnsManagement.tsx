"use client";
import React, { useEffect, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import ReturnsStats from "./ReturnsStats";
import ReturnsToolbar from "./ReturnsToolbar";
import ReturnsTable from "./ReturnsTable";
import ViewReturnModal from "./ViewReturnModal";
import ProcessReturnModal from "./ProcessReturnModal";
import { apiFetch } from "@/lib/api";

interface Return {
  id: number;
  returnNumber: string;
  originalOrderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  totalRefund: number;
  status: "Запрос на возврат" | "В обработке" | "Одобрен" | "Отклонен" | "Возврат завершен";
  returnType: "Полный возврат" | "Частичный возврат" | "Обмен";
  requestDate: string;
  reason: string;
}

const ReturnsManagement: React.FC = () => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [items, setItems] = useState<Return[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend: GET /api/returns?page=0&size=20
      const page = await apiFetch<{ content: any[] }>(`/api/returns?page=0&size=50`);
      // Map backend DTO to UI model
      const mapped: Return[] = page.content.map((r) => ({
        id: r.id,
        returnNumber: `RET-${r.id.toString().padStart(6, '0')}`,
        originalOrderNumber: r.orderId ? `ORD-${r.orderId}` : "-",
        customer: { name: r.customerId ? `ID ${r.customerId}` : "-", email: "", phone: "" },
        totalRefund: 0,
        status: r.status === 'NEW' ? 'Запрос на возврат' : r.status === 'PROCESSED' ? 'В обработке' : r.status === 'APPROVED' ? 'Одобрен' : r.status === 'REJECTED' ? 'Отклонен' : 'Возврат завершен',
        returnType: "Частичный возврат",
        requestDate: r.createdAt,
        reason: r.reason || "",
      }));
      setItems(mapped);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleViewReturn = (returnData: any) => {
    setSelectedReturn(returnData as Return);
    setIsViewModalOpen(true);
  };

  const handleProcessReturn = (returnData: any) => {
    setSelectedReturn(returnData as Return);
    setIsProcessModalOpen(true);
  };

  const handleUpdateReturnStatus = async (
    returnId: number,
    status: Return["status"],
    refundAmount?: number,
    notes?: string
  ) => {
    // Map UI status to backend enum
    const statusMap: Record<string, string> = {
      "Запрос на возврат": "NEW",
      "В обработке": "PROCESSED",
      "Одобрен": "APPROVED",
      "Отклонен": "REJECTED",
      "Возврат завершен": "REFUNDED",
    };
    try {
      await apiFetch(`/api/returns/${returnId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusMap[status] || 'PROCESSED' })
      });
      await loadData();
      setIsProcessModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportReturns = () => {
    loadData();
  };

  const handleRefreshReturns = () => {
    loadData();
  };

  return (
    <div className="space-y-6">
      <ReturnsStats />
      <ReturnsToolbar onExport={handleExportReturns} onRefresh={handleRefreshReturns} />
      <ComponentCard title="Список возвратов и запросов на возврат">
        {error && <div className="text-red-600 text-sm p-2">{error}</div>}
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Загрузка...</div>
        ) : (
          <ReturnsTable onViewReturn={handleViewReturn} onProcessReturn={handleProcessReturn} />
        )}
      </ComponentCard>
      <ViewReturnModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} returnData={selectedReturn} />
      <ProcessReturnModal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} onSave={handleUpdateReturnStatus} returnData={selectedReturn} />
    </div>
  );
};

export default ReturnsManagement;
