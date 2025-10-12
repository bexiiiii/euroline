import { API_URL } from "../api";

const BASE_URL = `${API_URL}/api/admin/system`;

export interface ActuatorComponent {
  status: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ActuatorHealth {
  status: string;
  components?: Record<string, ActuatorComponent>;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DiagnosticsResult {
  status: string;
  timestamp: number;
  health: ActuatorHealth;
  metrics: string[];
}

export interface MaintenanceStatus {
  enabled: boolean;
  timestamp: number;
}

export interface OneCStatus {
  connected: boolean;
  message?: string;
  timestamp: number;
}

interface RestartResponse {
  accepted: boolean;
  timestamp: number;
}

interface BackupResponse {
  accepted: boolean;
  message?: string;
  backupId?: string;
  timestamp?: number;
}

const resolveToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("admin_token") ?? localStorage.getItem("token") ?? null;
};

const authHeaders = (): Record<string, string> => {
  const token = resolveToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function getJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers as HeadersInit | undefined);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const tokenHeader = authHeaders();
  Object.entries(tokenHeader).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const systemApi = {
  async getSystemStatus(): Promise<ActuatorHealth> {
    return getJson<ActuatorHealth>(`${BASE_URL}/status`);
  },

  async getMetrics(): Promise<string[]> {
    return getJson<string[]>(`${BASE_URL}/metrics`);
  },

  async runDiagnostics(): Promise<DiagnosticsResult> {
    return getJson<DiagnosticsResult>(`${BASE_URL}/diagnostics`, { method: "POST" });
  },

  async createBackup(): Promise<BackupResponse> {
    return getJson<BackupResponse>(`${BASE_URL}/backup`, { method: "POST" });
  },

  async restartApplication(): Promise<RestartResponse> {
    return getJson<RestartResponse>(`${BASE_URL}/restart`, { method: "POST" });
  },

  async getMaintenanceStatus(): Promise<MaintenanceStatus> {
    return getJson<MaintenanceStatus>(`${BASE_URL}/maintenance`);
  },

  async setMaintenanceMode(enabled: boolean): Promise<MaintenanceStatus> {
    const params = new URLSearchParams({ enabled: String(enabled) });
    return getJson<MaintenanceStatus>(`${BASE_URL}/maintenance?${params.toString()}`, {
      method: "POST",
    });
  },

  async checkOneCConnection(): Promise<OneCStatus> {
    return getJson<OneCStatus>(`${BASE_URL}/onec/status`);
  },
};

export type { ActuatorHealth as SystemHealth };
