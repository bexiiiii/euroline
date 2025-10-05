"use client"

import Link from "next/link";
import { AuthorCard } from "@/components/ui/content-card"
import { useNewsFeed } from "@/hooks/useNewsFeed"

export function NewsComponent() {
  const { news, loading, error, reload } = useNewsFeed();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <p>{error}</p>
          <button 
            onClick={() => void reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 ">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {news.map((item) => (
          <Link key={item.id} href={`/news/${item.id}`} className="block">
            <AuthorCard
              backgroundImage={item.coverImageUrl || "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1651&q=80"}
              author={{
                name: "Новости компании",
                
                readTime: new Date(item.createdAt).toLocaleDateString('ru-RU')
              }}
              content={{
                title: item.title,
                description: item.description || `${item.content.slice(0, 100)}${item.content.length > 100 ? '…' : ''}`
              }}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
