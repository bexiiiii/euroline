"use client";

import React, { useState } from "react";
import NotificationComposerWidget from "@/components/notifications/NotificationComposerWidget";
import AdminNotificationHistoryTable from "@/components/notifications/AdminNotificationHistoryTable";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const AdminNotificationsPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const handleNotificationSent = () => {
    setRefreshKey(Date.now());
    setIsComposerOpen(false);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Уведомления" />
      <div className="space-y-4">
        <AdminNotificationHistoryTable
          refreshKey={refreshKey}
          action={
            <Button size="sm" onClick={() => setIsComposerOpen(true)} className="h-10! py-0!">
              Новое уведомление
            </Button>
          }
        />

        <Modal
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          size="xl"
          className="p-0"
        >
          <div className="p-5">
            <NotificationComposerWidget
              onSent={handleNotificationSent}
              className="border-0 p-0"
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
