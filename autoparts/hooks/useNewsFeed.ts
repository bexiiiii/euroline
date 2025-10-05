import { useCallback, useEffect, useState } from 'react'
import { getPublishedNews, NewsItem } from '@/lib/api/news'

interface UseNewsFeedOptions {
  limit?: number
}

interface UseNewsFeedReturn {
  news: NewsItem[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useNewsFeed(options: UseNewsFeedOptions = {}): UseNewsFeedReturn {
  const { limit } = options
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const items = await getPublishedNews(limit)
      setNews(items)
    } catch (err) {
      console.error('Failed to fetch news', err)
      setError('Не удалось загрузить новости')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    void load()
  }, [load])

  return {
    news,
    loading,
    error,
    reload: load,
  }
}
