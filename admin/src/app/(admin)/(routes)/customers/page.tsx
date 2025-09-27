"use client";
import { useCallback, useState } from "react";
import CustomersStats from "@/components/customers/CustomersStats";
import CustomersToolbar from "@/components/customers/CustomersToolbar";
import CustomersTable from "@/components/customers/CustomersTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { Modal } from "@/components/ui/modal";
import { customersApi, type Customer } from "@/lib/api/customers";

export default function CustomersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSuccess, setNewsletterSuccess] = useState<string | null>(null);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleRefresh = useCallback(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  const handleSendNewsletter = useCallback(() => {
    setNewsletterOpen(true);
    setNewsletterError(null);
    setNewsletterSuccess(null);
  }, []);

  const closeNewsletterModal = useCallback(() => {
    setNewsletterOpen(false);
    setNewsletterSending(false);
    setNewsletterError(null);
    setNewsletterSuccess(null);
  }, []);

  const submitNewsletter = useCallback(async () => {
    if (!newsletterMessage.trim()) {
      setNewsletterError("Введите текст уведомления");
      return;
    }

    setNewsletterSending(true);
    setNewsletterError(null);
    try {
      const response = await customersApi.sendNewsletter({
        subject: newsletterSubject.trim() || undefined,
        message: newsletterMessage.trim(),
      });

      if (response.sent) {
        const sentCount = response.recipients ?? 0;
        setNewsletterSuccess(
          sentCount > 0
            ? `Уведомления отправлены ${sentCount} клиентам`
            : "Уведомления поставлены в очередь"
        );
        setNewsletterSubject("");
        setNewsletterMessage("");
        triggerRefresh();
      } else {
        setNewsletterError("Не удалось отправить рассылку");
      }
    } catch (error) {
      setNewsletterError(
        error instanceof Error ? error.message : "Не удалось отправить рассылку"
      );
    } finally {
      setNewsletterSending(false);
    }
  }, [newsletterMessage, newsletterSubject, triggerRefresh]);

  const handleAddCustomer = useCallback(() => {
    console.log('Add customer modal');
  }, []);

  const handleExport = useCallback(() => {
    console.log('Export customers data');
  }, []);

  const handleViewCustomer = useCallback((customer: Customer) => {
    console.log("View customer:", customer);
  }, []);

  const handleEditCustomer = useCallback((customer: Customer) => {
    console.log("Edit customer:", customer);
  }, []);

  const handleDeleteCustomer = useCallback((customerId: number) => {
    console.log("Delete customer:", customerId);
  }, []);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Клиенты" />

      <CustomersStats />

      <CustomersToolbar
        onAddCustomer={handleAddCustomer}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onSendNewsletter={handleSendNewsletter}
      />

      <CustomersTable
        refreshKey={refreshKey}
        onViewCustomer={handleViewCustomer}
        onEditCustomer={handleEditCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />

      <Modal isOpen={newsletterOpen} onClose={closeNewsletterModal} size="md">
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Рассылка клиентам</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Отправьте уведомление всем активным клиентам. Уведомления получат только клиенты, которые не заблокированы.
            </p>
          </div>

          {newsletterError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
              {newsletterError}
            </div>
          )}

          {newsletterSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-900/20 dark:text-green-200">
              {newsletterSuccess}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Тема сообщения
            </label>
            <Input
              placeholder="Например, Новые предложения недели"
              value={newsletterSubject}
              onChange={(event) => setNewsletterSubject(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Текст уведомления
            </label>
            <TextArea
              rows={6}
              value={newsletterMessage}
              onChange={setNewsletterMessage}
              placeholder="Расскажите клиентам о новостях, акциях или обновлениях"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={closeNewsletterModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              disabled={newsletterSending}
            >
              Отмена
            </button>
            <button
              onClick={submitNewsletter}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70"
              disabled={newsletterSending}
            >
              {newsletterSending ? "Отправляем…" : "Отправить"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
