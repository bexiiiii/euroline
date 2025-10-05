"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getNewsById, NewsItem } from "@/lib/api/news";

export default function NewsDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchNewsDetail(Number(id));
    }
  }, [id]);

  const fetchNewsDetail = async (newsId: number) => {
    try {
      setLoading(true);
      const newsItem = await getNewsById(newsId);
      setNews(newsItem);
    } catch (err) {
      setError("Failed to load news");
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Новость не найдена</h1>
          <button 
            onClick={() => router.push('/news')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Вернуться к новостям
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-4xl mx-auto ">
        <button 
          onClick={() => router.push('/news')}
          className="flex items-center text-orange-700 hover:text-orange-800 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад к новостям
        </button>

        <article className="bg-white rounded-lg mt-20 overflow-hidden">
          {news.coverImageUrl && (
            <img 
              src={news.coverImageUrl} 
              alt={news.title} 
              className="w-full h-64 object-cover"
            />
          )}
          
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{news.title}</h1>
            
            <div className="flex items-center text-gray-500 text-sm mb-6">
              <span>
                {new Date(news.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="mx-2">•</span>
              <span>{news.published ? 'Опубликовано' : 'Черновик'}</span>
            </div>
            
            {news.description && (
              <p className="text-xl text-gray-600 mb-6">{news.description}</p>
            )}
            
            <div className="prose max-w-none">
              {news.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700">{paragraph}</p>
              ))}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
