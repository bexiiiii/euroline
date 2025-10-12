import { API_URL } from "../api";

interface ExportParams {
  type: string;
  from?: string;
  to?: string;
  fileName: string;
}

export async function exportAdminData({ type, from, to, fileName }: ExportParams): Promise<void> {
  const params = new URLSearchParams({ type });
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const response = await fetch(`${API_URL}/api/admin/import-export/export?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Не удалось экспортировать данные (${response.status})`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

