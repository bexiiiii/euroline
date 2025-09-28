"use client";
import * as React from "react";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";

function Announcement() {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="px-4 py-2 bg-orange-500 text-white rounded-md"
      >
        Show Banner
      </button>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <UpgradeBanner
  buttonText="Внимание!"
  description="Возврат не более чем на 36 291"
  onClick={() => console.log("clicked")}
  showCloseButton={false}
/>
    </div>
  );
}

export { Announcement };