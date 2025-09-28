import { PageResponse } from './types';

export interface SearchHistory {
  id: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  sessionId: string;
  searchQuery: string;
  searchType: 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'GENERAL';
  resultsCount: number;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  filters?: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    brand?: string;
    inStock?: boolean;
  };
  clickedResults?: number[];
  conversionProductId?: number;
  converted: boolean;
}

export interface SearchStats {
  totalSearches: number;
  searchesToday: number;
  uniqueSearchers: number;
  averageResultsPerSearch: number;
  conversionRate: number;
  topSearchQueries: {
    query: string;
    count: number;
    conversionRate: number;
  }[];
  searchesByType: {
    type: string;
    count: number;
  }[];
  searchesByHour: {
    hour: string;
    count: number;
  }[];
  noResultsQueries: {
    query: string;
    count: number;
  }[];
}

export interface SearchTrend {
  query: string;
  currentCount: number;
  previousCount: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendPercentage: number;
}

const BASE_URL = 'http://localhost:8080/api/admin';

export const searchHistoryApi = {
  getSearchHistory: async (
    page = 0,
    size = 20,
    sort = 'timestamp,desc',
    userId?: number,
    searchType?: string,
    hasResults?: boolean,
    converted?: boolean,
    startDate?: string,
    endDate?: string
  ): Promise<PageResponse<SearchHistory>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    });
    
    if (userId) params.append('userId', userId.toString());
    if (searchType) params.append('searchType', searchType);
    if (hasResults !== undefined) params.append('hasResults', hasResults.toString());
    if (converted !== undefined) params.append('converted', converted.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${BASE_URL}/search-history?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch search history');
    return response.json();
  },

  getSearchStats: async (days = 30): Promise<SearchStats> => {
    const response = await fetch(`${BASE_URL}/search-history/stats?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch search statistics');
    return response.json();
  },

  getUserSearchHistory: async (userId: number, page = 0, size = 20): Promise<PageResponse<SearchHistory>> => {
    const response = await fetch(`${BASE_URL}/search-history/user/${userId}?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user search history');
    return response.json();
  },

  getTopSearchQueries: async (days = 30, limit = 50): Promise<{
    query: string;
    count: number;
    conversionRate: number;
    lastSearched: string;
  }[]> => {
    const response = await fetch(`${BASE_URL}/search-history/top-queries?days=${days}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch top search queries');
    return response.json();
  },

  getNoResultsQueries: async (days = 30, limit = 50): Promise<{
    query: string;
    count: number;
    lastSearched: string;
  }[]> => {
    const response = await fetch(`${BASE_URL}/search-history/no-results?days=${days}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch no results queries');
    return response.json();
  },

  getSearchTrends: async (days = 30): Promise<SearchTrend[]> => {
    const response = await fetch(`${BASE_URL}/search-history/trends?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch search trends');
    return response.json();
  },

  getSearchByLocation: async (days = 30): Promise<{
    country: string;
    city: string;
    count: number;
    conversionRate: number;
  }[]> => {
    const response = await fetch(`${BASE_URL}/search-history/by-location?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch search by location');
    return response.json();
  },

  getPopularFilters: async (days = 30): Promise<{
    filterType: string;
    filterValue: string;
    count: number;
  }[]> => {
    const response = await fetch(`${BASE_URL}/search-history/popular-filters?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch popular filters');
    return response.json();
  },

  deleteSearchHistory: async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/search-history/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete search history');
  },

  deleteUserSearchHistory: async (userId: number): Promise<{ deletedCount: number }> => {
    const response = await fetch(`${BASE_URL}/search-history/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete user search history');
    return response.json();
  },

  cleanupOldSearchHistory: async (days: number): Promise<{ deletedCount: number }> => {
    const response = await fetch(`${BASE_URL}/search-history/cleanup?days=${days}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to cleanup old search history');
    return response.json();
  },

  exportSearchHistory: async (
    userId?: number,
    startDate?: string,
    endDate?: string,
    format: 'CSV' | 'JSON' = 'CSV'
  ): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    
    if (userId) params.append('userId', userId.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${BASE_URL}/search-history/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to export search history');
    return response.blob();
  },

  getSearchConversionFunnel: async (days = 30): Promise<{
    totalSearches: number;
    searchesWithResults: number;
    searchesWithClicks: number;
    searchesWithConversions: number;
    conversionRate: number;
    averageTimeToConversion: number;
  }> => {
    const response = await fetch(`${BASE_URL}/search-history/conversion-funnel?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch search conversion funnel');
    return response.json();
  },
};
