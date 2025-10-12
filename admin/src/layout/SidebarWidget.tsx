import React from "react";
import NotificationComposerWidget from "@/components/notifications/NotificationComposerWidget";

const SidebarWidget: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 xl:sticky xl:top-24">
      <NotificationComposerWidget />
    </div>
  );
};

export default SidebarWidget;
