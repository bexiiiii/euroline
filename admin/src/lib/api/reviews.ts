import { PageResponse } from './types';

export interface CustomerReview {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  productId: number;
  productName: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  isPublished: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  approvedAt?: string;
  adminResponse?: string;
  adminResponseAt?: string;
}

export interface UpdateReviewRequest {
  isApproved?: boolean;
  isPublished?: boolean;
  adminResponse?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingReviews: number;
  approvedReviews: number;
  publishedReviews: number;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
}

const BASE_URL = 'http://localhost:8080/api/admin';

export const reviewsApi = {
  getReviews: async (page = 0, size = 10, sort = 'createdAt,desc', status?: 'PENDING' | 'APPROVED' | 'PUBLISHED'): Promise<PageResponse<CustomerReview>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    });
    
    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`${BASE_URL}/reviews?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },

  getReview: async (id: number): Promise<CustomerReview> => {
    const response = await fetch(`${BASE_URL}/reviews/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch review');
    return response.json();
  },

  getPendingReviews: async (page = 0, size = 10): Promise<PageResponse<CustomerReview>> => {
    const response = await fetch(`${BASE_URL}/reviews/pending?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch pending reviews');
    return response.json();
  },

  getReviewStats: async (): Promise<ReviewStats> => {
    const response = await fetch(`${BASE_URL}/reviews/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch review statistics');
    return response.json();
  },

  approveReview: async (id: number): Promise<CustomerReview> => {
    const response = await fetch(`${BASE_URL}/reviews/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to approve review');
    return response.json();
  },

  rejectReview: async (id: number): Promise<CustomerReview> => {
    const response = await fetch(`${BASE_URL}/reviews/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to reject review');
    return response.json();
  },

  publishReview: async (id: number): Promise<CustomerReview> => {
    const response = await fetch(`${BASE_URL}/reviews/${id}/publish`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to publish review');
    return response.json();
  },

  unpublishReview: async (id: number): Promise<CustomerReview> => {
    const response = await fetch(`${BASE_URL}/reviews/${id}/unpublish`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to unpublish review');
    return response.json();
  },

  updateReview: async (id: number, request: UpdateReviewRequest): Promise<CustomerReview> => {
    const response = await fetch(`${BASE_URL}/reviews/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to update review');
    return response.json();
  },

  deleteReview: async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/reviews/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete review');
  },

  addAdminResponse: async (id: number, response: string): Promise<CustomerReview> => {
    const res = await fetch(`${BASE_URL}/reviews/${id}/response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ response }),
    });
    if (!res.ok) throw new Error('Failed to add admin response');
    return res.json();
  },
};
