"use client";
import React from "react";
import Button from "../ui/button/Button";

interface CustomersToolbarProps {
  onRefresh: () => void;
  onSendNewsletter: () => void;
}

const CustomersToolbar: React.FC<CustomersToolbarProps> = ({
  onRefresh,
  onSendNewsletter,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-10 py-0"
        onClick={onRefresh}
        startIcon={
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        }
      >
        Обновить
      </Button>
      <Button
        size="sm"
        className="h-10 py-0"
        onClick={onSendNewsletter}
        startIcon={
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
          </svg>
        }
      >
        Рассылка
      </Button>
    </div>
  );
};

export default CustomersToolbar;
