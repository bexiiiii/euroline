"use client";
import React from "react";
import Button from "../ui/button/Button";

interface FinanceLoadErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/** Встроенное сообщение об ошибке загрузки с кнопкой "Повторить". */
const FinanceLoadError: React.FC<FinanceLoadErrorProps> = ({ message, onRetry, className = "" }) => (
  <div
    role="alert"
    className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 ${className}`}
  >
    <span>{message}</span>
    {onRetry && (
      <Button size="xs" variant="outline" onClick={onRetry}>
        Повторить
      </Button>
    )}
  </div>
);

export default FinanceLoadError;
