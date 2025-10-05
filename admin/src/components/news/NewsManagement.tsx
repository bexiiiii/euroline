"use client";
import React, { useCallback, useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import { getNews, createNews, updateNews, deleteNews, NewsItem, NewsRequest } from "@/lib/api/news";
import NewsTable from "@/components/news/NewsTable";
import NewsModal from "@/components/news/NewsModal";
import { useToast } from "@/context/ToastContext";

const NewsManagement: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const fetchNews = useCallback(async () => {
    try {
      setIsLoading(true);
      const news = await getNews();
      setNewsItems(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      showError("Не удалось загрузить новости. Попробуйте обновить страницу.");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleCreateNews = () => {
    setSelectedNews(null);
    setIsModalOpen(true);
  };

  const handleEditNews = (news: NewsItem) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  };

  const handleDeleteNews = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту новость?")) {
      return;
    }
    try {
      await deleteNews(id);
      showSuccess("Новость удалена.");
      await fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
      showError("Ошибка при удалении новости.");
    }
  };

  const handleSaveNews = async (newsData: NewsRequest) => {
    try {
      setIsSaving(true);
      if (selectedNews) {
        await updateNews(selectedNews.id, newsData);
        showSuccess("Новость обновлена.");
      } else {
        await createNews(newsData);
        showSuccess("Новость создана.");
      }
      setIsModalOpen(false);
      setSelectedNews(null);
      await fetchNews();
    } catch (error) {
      console.error("Error saving news:", error);
      showError("Не удалось сохранить новость. Проверьте данные и попробуйте снова.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-800">Новости</h2>
          <button
            onClick={handleCreateNews}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Создать новость
          </button>
        </div>
      </div>

      <ComponentCard title="Список новостей">
        <NewsTable
          newsItems={newsItems}
          isLoading={isLoading}
          onEdit={handleEditNews}
          onDelete={handleDeleteNews}
        />
      </ComponentCard>

      <NewsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNews(null);
        }}
        onSave={handleSaveNews}
        news={selectedNews}
        isSaving={isSaving}
      />
    </div>
  );
};

export default NewsManagement;
