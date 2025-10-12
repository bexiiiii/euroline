"use client";

import React, { useRef, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { notificationsApi, NotificationAudience } from "@/lib/api/notifications";
import { uploadFile } from "@/lib/api/files";
import { useToast } from "@/context/ToastContext";
import Image from "next/image";

const audienceOptions: { value: NotificationAudience; label: string }[] = [
  { value: "ALL", label: "Всем пользователям" },
  { value: "USERS", label: "Только клиентам" },
  { value: "ADMINS", label: "Только администраторам" },
];

interface NotificationComposerWidgetProps {
  onSent?: () => void;
  className?: string;
}

const NotificationComposerWidget: React.FC<NotificationComposerWidgetProps> = ({
  onSent,
  className,
}) => {
  const { success: showSuccess, error: showError } = useToast();
  const [audience, setAudience] = useState<NotificationAudience>("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<boolean>(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setImageUrl(null);
    setAudience("ALL");
    setHighlight(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError("Размер изображения не должен превышать 5 МБ");
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setImageUrl(uploaded.url);
      showSuccess("Изображение загружено");
    } catch (err) {
      console.error("Failed to upload image", err);
      showError("Не удалось загрузить изображение");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSend = async () => {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    if (!trimmedTitle) {
      showError("Введите тему уведомления");
      return;
    }
    if (!trimmedMessage) {
      showError("Введите текст уведомления");
      return;
    }
    setSending(true);
    try {
      await notificationsApi.sendAdminNotification({
        title: trimmedTitle,
        message: trimmedMessage,
        audience,
        imageUrl,
        status: highlight,
      });
      showSuccess("Уведомление отправлено");
      resetForm();
      onSent?.();
    } catch (err) {
      console.error("Failed to send notification", err);
      showError("Не удалось отправить уведомление");
    } finally {
      setSending(false);
    }
  };

  const containerClassName = [
    "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Отправка уведомления</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Разошлите системное сообщение выбранной аудитории</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Получатели</Label>
          <Select
            options={audienceOptions}
            value={audience}
            onChange={(value) => setAudience(value as NotificationAudience)}
            placeholder="Выберите аудиторию"
          />
        </div>

        <div className="space-y-2">
          <Label>Тема</Label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например, Обновление сервиса"
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label>Текст уведомления</Label>
          <TextArea
            value={message}
            onChange={(value) => setMessage(value)}
            placeholder="Кратко опишите суть сообщения"
            rows={4}
            maxLength={500}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Подсветка уведомления</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Отметьте, если сообщение важно</p>
          </div>
          <Checkbox
            checked={highlight}
            onChange={(value) => setHighlight(value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="mb-0">Изображение (опционально)</Label>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                Удалить
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={uploading}
            >
              {uploading ? "Загрузка..." : imageUrl ? "Заменить изображение" : "Загрузить изображение"}
            </Button>
            {imageUrl && (
              <div className="relative h-12 w-12 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                <Image
                  src={imageUrl}
                  alt="Превью"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleSend}
          disabled={sending || uploading}
        >
          {sending ? "Отправка..." : "Отправить уведомление"}
        </Button>
      </div>
    </div>
  );
};

export default NotificationComposerWidget;
