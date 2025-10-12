"use client";

import React, { useState } from "react";
import NotificationComposerWidget from "@/components/notifications/NotificationComposerWidget";
import AdminNotificationHistoryTable from "@/components/notifications/AdminNotificationHistoryTable";

const AdminNotificationsPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  const handleNotificationSent = () => {
    setRefreshKey(Date.now());
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Центр уведомлений</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Создавайте системные сообщения, управляйте историей рассылок и отслеживайте аудитории.
          </p>
        </div>
        <NotificationComposerWidget onSent={handleNotificationSent} />
      </div>

      <AdminNotificationHistoryTable refreshKey={refreshKey} />
    </div>
  );
};

export default AdminNotificationsPage;

