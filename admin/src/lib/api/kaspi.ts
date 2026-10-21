import { apiFetch } from "../api";

export interface KaspiConnectionStatus {
  enabled: boolean;
  status: "DISCONNECTED" | "CONNECTED" | "EXPIRED";
  phone?: string | null;
  orgName?: string | null;
  connectedAt?: string | null;
  lastCheckedAt?: string | null;
  lastError?: string | null;
}

export interface KaspiSendPhoneResponse {
  smsSent: boolean;
  message?: string | null;
  errorCode?: string | null;
}

// Kaspi Pay cashier connection (used for client balance top-ups by invoice / QR)
export const kaspiApi = {
  status: () => apiFetch<KaspiConnectionStatus>("/api/admin/kaspi/status"),
  check: () => apiFetch<KaspiConnectionStatus>("/api/admin/kaspi/check", { method: "POST" }),
  init: () => apiFetch<{ processId: string }>("/api/admin/kaspi/auth/init", { method: "POST" }),
  sendPhone: (processId: string, phone: string) =>
    apiFetch<KaspiSendPhoneResponse>("/api/admin/kaspi/auth/send-phone", {
      method: "POST",
      body: JSON.stringify({ processId, phone }),
    }),
  verifyOtp: (processId: string, otp: string) =>
    apiFetch<KaspiConnectionStatus>("/api/admin/kaspi/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ processId, otp }),
    }),
  disconnect: () => apiFetch<KaspiConnectionStatus>("/api/admin/kaspi/disconnect", { method: "POST" }),
};
