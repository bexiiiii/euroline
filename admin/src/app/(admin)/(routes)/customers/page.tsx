"use client";
import { useCallback, useState } from "react";
import CustomersStats from "@/components/customers/CustomersStats";
import CustomersToolbar from "@/components/customers/CustomersToolbar";
import CustomersTable from "@/components/customers/CustomersTable";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { Modal } from "@/components/ui/modal";
import { customersApi } from "@/lib/api/customers";

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

  return (
    <div className="space-y-4">
      <PageBreadcrumb pageTitle="Клиенты" />

      <CustomersStats refreshKey={refreshKey} />

      <CustomersTable
        refreshKey={refreshKey}
        onDataChanged={triggerRefresh}
        actions={
          <CustomersToolbar
            onRefresh={handleRefresh}
            onSendNewsletter={handleSendNewsletter}
          />
        }
      />

      <Modal isOpen={newsletterOpen} onClose={closeNewsletterModal} size="md">
        <div className="space-y-4 p-5">
          <div className="pr-10">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Рассылка клиентам</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Получат все незаблокированные клиенты.
            </p>
          </div>

          {newsletterError && (
            <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">
              {newsletterError}
            </div>
          )}

          {newsletterSuccess && (
            <div className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-600 dark:bg-success-500/15 dark:text-success-500">
              {newsletterSuccess}
            </div>
          )}

          <div>
            <label htmlFor="newsletter-subject" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Тема
            </label>
            <Input
              id="newsletter-subject"
              value={newsletterSubject}
              onChange={(event) => setNewsletterSubject(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="newsletter-message" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Текст
            </label>
            <TextArea
              id="newsletter-message"
              rows={5}
              value={newsletterMessage}
              onChange={setNewsletterMessage}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={closeNewsletterModal}
              disabled={newsletterSending}
            >
              Отмена
            </Button>
            <Button size="sm" onClick={submitNewsletter} disabled={newsletterSending}>
              {newsletterSending ? "Отправка..." : "Отправить"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
