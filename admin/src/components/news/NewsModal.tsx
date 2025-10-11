import React, { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import { NewsItem, NewsRequest } from "@/lib/api/news";
import { uploadFile } from "@/lib/api/files";
import NewsPreviewCard from "@/components/news/NewsPreviewCard";
import { API_URL } from "@/lib/api";

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
      setUploadError("Не удалось загрузить изображение. Попробуйте снова.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl p-6">
      <div>
        <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          {news ? "Редактировать новость" : "Создать новость"}
        </h4>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Заголовок *</Label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
              {errors.title && <p className="mt-2 text-sm text-red-500">{errors.title}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Краткое описание</Label>
                <span className="text-xs text-gray-400">{description.length}/{DESCRIPTION_LIMIT}</span>
              </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_LIMIT))}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
              {errors.description && <p className="mt-2 text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="space-y-3">
              <Label>Обложка</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="URL изображения"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  />
                  <p className="mt-2 text-sm text-gray-500">Или загрузите изображение с компьютера</p>
                </div>
                <div className="sm:mt-2">
                  <button
                    type="button"
                    onClick={triggerFileUpload}
                    disabled={isUploading || isSaving}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isUploading ? "Загрузка..." : "Загрузить"}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
              {errors.coverImageUrl && <p className="text-sm text-red-500">{errors.coverImageUrl}</p>}
            </div>

            <div>
              <Label htmlFor="content">Содержание *</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
              {errors.content && <p className="mt-2 text-sm text-red-500">{errors.content}</p>}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="published" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Опубликовать
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
                disabled={isSaving}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
              >
                {isSaving ? "Сохранение..." : news ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>

          <div className="space-y-4 lg:pl-6">
            <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Превью</h5>
            <NewsPreviewCard
              title={title || "Заголовок новости"}
              description={description || "Краткое описание будет отображаться на карточке новости."}
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
