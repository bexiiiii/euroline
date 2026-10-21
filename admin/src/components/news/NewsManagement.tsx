"use client";
import React, { useCallback, useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { getNews, createNews, updateNews, deleteNews, NewsItem, NewsRequest } from "@/lib/api/news";
import NewsTable from "@/components/news/NewsTable";
import NewsModal from "@/components/news/NewsModal";
import { useToast } from "@/context/ToastContext";
import { PlusIcon } from "@/components/finance/tableUi";

const NewsManagement: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { success: showSuccess, error: showError } = useToast();

  const fetchNews = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const news = await getNews();
      setNewsItems(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      setLoadError("Не удалось загрузить данные");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    if (!window.confirm("Удалить новость?")) {
      return;
    }
    try {
      await deleteNews(id);
      showSuccess("Новость удалена");
      await fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
      showError("Не удалось удалить новость");
    }
  };

  const handleSaveNews = async (newsData: NewsRequest) => {
    try {
      setIsSaving(true);
      if (selectedNews) {
        await updateNews(selectedNews.id, newsData);
        showSuccess("Новость обновлена");
      } else {
        await createNews(newsData);
        showSuccess("Новость создана");
      }
      setIsModalOpen(false);
      setSelectedNews(null);
      await fetchNews();
    } catch (error) {
      console.error("Error saving news:", error);
      showError("Не удалось сохранить новость");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <ComponentCard
        title=""
        action={
          <Button size="sm" startIcon={<PlusIcon />} onClick={handleCreateNews}>
            Создать новость
          </Button>
        }
      >
        <NewsTable
          newsItems={newsItems}
          isLoading={isLoading}
          error={loadError}
          onRetry={fetchNews}
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
