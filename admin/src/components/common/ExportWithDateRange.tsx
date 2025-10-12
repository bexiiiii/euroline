"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { useToast } from "@/context/ToastContext";

export interface ExportDateRange {
  from: string;
  to: string;
}

interface ExportWithDateRangeProps {
  onConfirm: (range: ExportDateRange) => Promise<void> | void;
  triggerLabel?: string;
  title?: string;
  description?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  icon?: React.ReactNode;
}

const ExportWithDateRange: React.FC<ExportWithDateRangeProps> = ({
  onConfirm,
  triggerLabel = "Экспорт",
  title = "Экспорт данных",
  description = "Выберите период, за который нужно сформировать файл.",
  variant = "outline",
  size = "sm",
  className,
  icon,
}) => {
  const { error: showError } = useToast();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!from || !to) {
      showError("Укажите дату начала и окончания периода");
      return;
    }
    if (new Date(from) > new Date(to)) {
      showError("Дата начала не может быть позже даты окончания");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({ from, to });
      setOpen(false);
    } catch (err) {
      console.error("Export failed", err);
      showError("Не удалось выполнить экспорт");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
        startIcon={icon}
      >
        {triggerLabel}
      </Button>
      <Modal
        isOpen={open}
        onClose={() => {
          if (!submitting) {
            setOpen(false);
          }
        }}
        className="max-w-md"
      >
        <div className="space-y-5 p-6 sm:p-7">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="export-from">Дата начала</Label>
              <Input
                id="export-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="export-to">Дата окончания</Label>
              <Input
                id="export-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!submitting) {
                  setOpen(false);
                }
              }}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Экспорт..." : "Экспортировать"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ExportWithDateRange;
