import { PageResponse } from './types';

export interface EventLog {
  id: number;
  eventType: 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 
             'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'PRODUCT_DELETED' | 
             'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED' |
             'PAYMENT_COMPLETED' | 'PAYMENT_FAILED' | 'REFUND_ISSUED' |
             'SETTINGS_UPDATED' | 'SYSTEM_BACKUP' | 'SYSTEM_RESTART' |
             'ADMIN_ACTION' | 'SECURITY_EVENT' | 'ERROR_OCCURRED';
  entityType?: 'USER' | 'PRODUCT' | 'ORDER' | 'PAYMENT' | 'SYSTEM' | 'ADMIN';
  entityId?: number;
  userId?: number;
  userName?: string;
  description: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
  sessionId?: string;
}

export interface CreateEventLogRequest {
  eventType: EventLog['eventType'];
  entityType?: EventLog['entityType'];
  entityId?: number;
  description: string;
  details?: string;
  success?: boolean;
  errorMessage?: string;
}

export interface EventLogStats {
  totalEvents: number;
  todayEvents: number;
  errorEvents: number;
  topEventTypes: {
    eventType: string;
    count: number;
  }[];
  recentErrorEvents: EventLog[];
}

const BASE_URL = 'http://localhost:8080/api/admin';

export const eventLogApi = {
  getEventLogs: async (
    page = 0, 
    size = 20, 
    sort = 'createdAt,desc',
    eventType?: string,
    entityType?: string,
    startDate?: string,
    endDate?: string,
    success?: boolean
  ): Promise<PageResponse<EventLog>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
    });
    
    if (eventType) params.append('eventType', eventType);
    if (entityType) params.append('entityType', entityType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (success !== undefined) params.append('success', success.toString());

    const response = await fetch(`${BASE_URL}/event-logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch event logs');
    return response.json();
  },

  getEventLog: async (id: number): Promise<EventLog> => {
    const response = await fetch(`${BASE_URL}/event-logs/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch event log');
    return response.json();
  },

  getEventLogStats: async (days = 30): Promise<EventLogStats> => {
    const response = await fetch(`${BASE_URL}/event-logs/stats?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch event log statistics');
    return response.json();
  },

  getUserEventLogs: async (userId: number, page = 0, size = 20): Promise<PageResponse<EventLog>> => {
    const response = await fetch(`${BASE_URL}/event-logs/user/${userId}?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user event logs');
    return response.json();
  },

  getEntityEventLogs: async (entityType: string, entityId: number): Promise<EventLog[]> => {
    const response = await fetch(`${BASE_URL}/event-logs/entity/${entityType}/${entityId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch entity event logs');
    return response.json();
  },

  getErrorEventLogs: async (page = 0, size = 20, hours = 24): Promise<PageResponse<EventLog>> => {
    const response = await fetch(`${BASE_URL}/event-logs/errors?page=${page}&size=${size}&hours=${hours}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch error event logs');
    return response.json();
  },

  getSecurityEventLogs: async (page = 0, size = 20, hours = 24): Promise<PageResponse<EventLog>> => {
    const response = await fetch(`${BASE_URL}/event-logs/security?page=${page}&size=${size}&hours=${hours}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch security event logs');
    return response.json();
  },

  getLoginAttempts: async (page = 0, size = 20, hours = 24): Promise<PageResponse<EventLog>> => {
    const response = await fetch(`${BASE_URL}/event-logs/login-attempts?page=${page}&size=${size}&hours=${hours}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch login attempts');
    return response.json();
  },

  createEventLog: async (request: CreateEventLogRequest): Promise<EventLog> => {
    const response = await fetch(`${BASE_URL}/event-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create event log');
    return response.json();
  },

  deleteEventLog: async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/event-logs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete event log');
  },

  deleteOldEventLogs: async (days: number): Promise<{ deletedCount: number }> => {
    const response = await fetch(`${BASE_URL}/event-logs/cleanup?days=${days}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete old event logs');
    return response.json();
  },

  exportEventLogs: async (
    eventType?: string,
    startDate?: string,
    endDate?: string,
    format: 'CSV' | 'JSON' = 'CSV'
  ): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    
    if (eventType) params.append('eventType', eventType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${BASE_URL}/event-logs/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to export event logs');
    return response.blob();
  },

  getEventTypes: async (): Promise<string[]> => {
    const response = await fetch(`${BASE_URL}/event-logs/event-types`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch event types');
    return response.json();
  },
};
