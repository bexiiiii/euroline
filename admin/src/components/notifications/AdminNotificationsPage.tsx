"use client";

import React, { useState } from "react";
import NotificationComposerWidget from "@/components/notifications/NotificationComposerWidget";
import AdminNotificationHistoryTable from "@/components/notifications/AdminNotificationHistoryTable";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

const AdminNotificationsPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const handleNotificationSent = () => {
    setRefreshKey(Date.now());
    setIsComposerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Центр уведомлений</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Создавайте системные сообщения, управляйте историей рассылок и отслеживайте аудитории.
          </p>
        </div>
        <Button onClick={() => setIsComposerOpen(true)} className="w-full sm:w-auto">
          Новое уведомление
        </Button>
      </div>

      <AdminNotificationHistoryTable refreshKey={refreshKey} />

      <Modal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        size="xl"
        className="p-0"
      >
        <div className="p-6 sm:p-8">
          <NotificationComposerWidget
            onSent={handleNotificationSent}
            className="border-0 p-0 shadow-none"
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminNotificationsPage;
