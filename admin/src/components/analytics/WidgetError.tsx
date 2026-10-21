"use client";
import React from "react";
import Button from "@/components/ui/button/Button";

interface WidgetErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Inline error state for dashboard/analytics widgets. */
export default function WidgetError({
  message = "Не удалось загрузить данные",
  onRetry,
  className = "",
}: WidgetErrorProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 py-10 text-center ${className}`.trim()}
    >
      <p className="text-sm text-error-600 dark:text-error-400">{message}</p>
      {onRetry && (
        <Button size="xs" variant="outline" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  );
}
