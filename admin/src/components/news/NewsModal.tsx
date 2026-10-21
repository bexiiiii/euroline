import React, { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { NewsItem, NewsRequest } from "@/lib/api/news";
import { uploadFile } from "@/lib/api/files";
import NewsPreviewCard from "@/components/news/NewsPreviewCard";
import { API_URL } from "@/lib/api";
import { controlClass } from "@/components/finance/tableUi";

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (news: NewsRequest) => Promise<void> | void;
  news: NewsItem | null;
  isSaving: boolean;
}

type FormErrors = Partial<Record<"title" | "description" | "coverImageUrl" | "content", string>>;

const DESCRIPTION_LIMIT = 500;

const API_ORIGIN = API_URL;

const toPreviewUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (!API_ORIGIN) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose, onSave, news, isSaving }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (news) {
      setTitle(news.title ?? "");
      setDescription(news.description ?? "");
      setCoverImageUrl(news.coverImageUrl ?? "");
      setContent(news.content ?? "");
      setPublished(Boolean(news.published));
    } else {
      resetForm();
    }

    setErrors({});
    setUploadError(null);
  }, [isOpen, news]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCoverImageUrl("");
    setContent("");
    setPublished(false);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!title.trim()) {
      nextErrors.title = "Введите заголовок";
    }
    if (!content.trim()) {
      nextErrors.content = "Введите текст новости";
    }
    if (description && description.length > DESCRIPTION_LIMIT) {
      nextErrors.description = `Описание не должно превышать ${DESCRIPTION_LIMIT} символов`;
    }
    if (coverImageUrl && coverImageUrl.length > 2048) {
      nextErrors.coverImageUrl = "Ссылка на изображение слишком длинная";
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: NewsRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      content: content.trim(),
      published,
    };

    try {
      await onSave(payload);
    } catch (error) {
      // Ошибка обрабатывается в вызывающем компоненте
      return;
    }

    handleClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadFile(file);
      setCoverImageUrl(response.url);
      setErrors((prev) => ({ ...prev, coverImageUrl: undefined }));
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Не удалось загрузить изображение");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  const errorText = (text?: string | null) =>
    text ? <p className="mt-1 text-xs text-error-600 dark:text-error-500">{text}</p> : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" className="p-0">
      <div className="p-5">
        <h2 className="mb-4 pr-12 text-base font-semibold text-gray-800 dark:text-white/90">
          {news ? "Редактирование новости" : "Новая новость"}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Заголовок</Label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${controlClass} w-full`}
              />
              {errorText(errors.title)}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Краткое описание</Label>
                <span className="text-xs tabular-nums text-gray-400">{description.length}/{DESCRIPTION_LIMIT}</span>
              </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_LIMIT))}
                rows={2}
                className={`${controlClass} h-auto w-full py-2`}
              />
              {errorText(errors.description)}
            </div>

            <div>
              <Label htmlFor="cover-url">Обложка</Label>
              <div className="flex gap-2">
                <input
                  id="cover-url"
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="Ссылка на изображение"
                  className={`${controlClass} min-w-0 flex-1`}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={triggerFileUpload}
                  disabled={isUploading || isSaving}
                >
                  {isUploading ? "Загрузка…" : "Загрузить"}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              {errorText(uploadError)}
              {errorText(errors.coverImageUrl)}
            </div>

            <div>
              <Label htmlFor="content">Текст</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className={`${controlClass} h-auto w-full py-2`}
              />
              {errorText(errors.content)}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="published" className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="size-4 rounded border-gray-300 accent-brand-500 dark:border-gray-600"
                />
                Опубликовать
              </label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleClose} disabled={isSaving}>
                  Отмена
                </Button>
                <Button type="submit" size="sm" disabled={isSaving || isUploading}>
                  {isSaving ? "Сохранение…" : news ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Превью</p>
            <NewsPreviewCard
              title={title || "Заголовок"}
              description={description || "Краткое описание"}
              coverImageUrl={toPreviewUrl(coverImageUrl)}
              published={published}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NewsModal;
