export interface SystemStatus {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

export interface DatabaseStatus {
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  connectionCount: number;
  activeConnections: number;
  responseTime: number;
  lastBackup?: string;
  databaseSize: number;
}

export interface CacheStatus {
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
  keyCount: number;
}

export interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  loadAverage: number[];
  activeThreads: number;
}

export interface ApiEndpointHealth {
  endpoint: string;
  status: 'UP' | 'DOWN' | 'SLOW';
  responseTime: number;
  lastChecked: string;
  errorCount: number;
}

export interface SystemHealth {
  overall: SystemStatus;
  database: DatabaseStatus;
  cache: CacheStatus;
  metrics: ServerMetrics;
  endpoints: ApiEndpointHealth[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  logger: string;
  message: string;
  exception?: string;
  userId?: number;
  requestId?: string;
}

export interface ErrorSummary {
  errorType: string;
  count: number;
  lastOccurrence: string;
  endpoints: string[];
}

import { API_URL } from '../api';

const BASE_URL = `${API_URL}/api/admin`;

export const systemApi = {
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await fetch(`${BASE_URL}/system/health`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch system health');
    return response.json();
  },

  getSystemStatus: async (): Promise<SystemStatus> => {
    const response = await fetch(`${BASE_URL}/system/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch system status');
    return response.json();
  },

  getDatabaseStatus: async (): Promise<DatabaseStatus> => {
    const response = await fetch(`${BASE_URL}/system/database`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch database status');
    return response.json();
  },

  getCacheStatus: async (): Promise<CacheStatus> => {
    const response = await fetch(`${BASE_URL}/system/cache`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch cache status');
    return response.json();
  },

  getServerMetrics: async (): Promise<ServerMetrics> => {
    const response = await fetch(`${BASE_URL}/system/metrics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch server metrics');
    return response.json();
  },

  getApiEndpointsHealth: async (): Promise<ApiEndpointHealth[]> => {
    const response = await fetch(`${BASE_URL}/system/endpoints`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch API endpoints health');
    return response.json();
  },

  getSystemLogs: async (page = 0, size = 100, level?: string, startDate?: string, endDate?: string): Promise<{ content: LogEntry[], totalElements: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (level) params.append('level', level);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${BASE_URL}/system/logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch system logs');
    return response.json();
  },

  getErrorSummary: async (hours = 24): Promise<ErrorSummary[]> => {
    const response = await fetch(`${BASE_URL}/system/errors/summary?hours=${hours}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch error summary');
    return response.json();
  },

  clearCache: async (): Promise<void> => {
    const response = await fetch(`${BASE_URL}/system/cache/clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to clear cache');
  },

  restartApplication: async (): Promise<void> => {
    const response = await fetch(`${BASE_URL}/system/restart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to restart application');
  },

  performHealthCheck: async (): Promise<SystemHealth> => {
    const response = await fetch(`${BASE_URL}/system/health-check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to perform health check');
    return response.json();
  },

  backupDatabase: async (): Promise<{ backupId: string, fileName: string }> => {
    const response = await fetch(`${BASE_URL}/system/database/backup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to backup database');
    return response.json();
  },
};
